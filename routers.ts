import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { pacientes, consultas } from "./schema";
import * as db from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = mysql.createPool(process.env.DATABASE_URL!);
const drizzleDb = drizzle(connection);
import { aiOrchestrator } from "./ai/orchestrator";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { ESCORES_CATALOGO } from "./shared/escoresCatalogo";
import { calcularEscoresPadrao, montarEscoreContexto } from "./shared/escoreCalcs";

const PARAMETRO_ID_MAP: Record<string, number> = {
  hemoglobina: 1,
  rdw: 2,
  leucocitos: 3,
  leucocito: 3,
  plaquetas: 4,
  hematocrito: 5,
  glicemia: 6,
  hba1c: 7,
  tsh: 8,
  t4livre: 9,
  creatinina: 10,
  ureia: 11,
};

function normalizarSlug(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "");
}

function gerarIdParametro(parametro: string, fallbackOffset: number = 1000) {
  const slug = normalizarSlug(parametro);
  const mapped = PARAMETRO_ID_MAP[slug as keyof typeof PARAMETRO_ID_MAP];
  if (mapped) return mapped;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return fallbackOffset + (hash % 9000);
}

function normalizeResultados(resultados?: Array<any>) {
  if (!resultados || resultados.length === 0) return [];

  return resultados.map((resultado, index) => {
    const parametro = resultado.parametro || resultado.nome || "";
    const id = resultado.id ?? gerarIdParametro(parametro, 1000 + index);

    return {
      id,
      parametro,
      valor: resultado.valor ?? "",
      unidade: resultado.unidade ?? "",
      referencia: resultado.referencia ?? resultado.valorReferencia ?? "",
      status: resultado.status ?? "normal",
    };
  });
}

// MÓDULO 10: BUSCA GLOBAL
const buscaGlobalProcedure = protectedProcedure
  .input(
    z.object({
      termo: z.string().min(2),
      limitPacientes: z.number().default(5),
      limitConsultas: z.number().default(5),
    })
  )
  .query(async ({ input }) => {
    const { termo, limitPacientes, limitConsultas } = input;
    const pattern = `%${termo}%`;

    // PACIENTES
    const pacientesResult = await drizzleDb
      .select({
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        contatoWhatsapp: pacientes.contatoWhatsapp,
        dataNascimento: pacientes.dataNascimento,
      })
      .from(pacientes)
      .where(
        hipotesesDiagnosticas: z.string().optional(),
        conduta: z.string().optional(),
        observacoes: z.string().optional(),
        status: z.enum(["agendada", "em_andamento", "concluida", "cancelada"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createConsulta({
          ...input,
          medicoId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        audioPath: z.string().optional(),
        audioUrl: z.string().optional(),
        anamnese: z.any().optional(),
        exameFisico: z.any().optional(),
        hipotesesDiagnosticas: z.string().optional(),
        conduta: z.string().optional(),
        observacoes: z.string().optional(),
        resumo: z.any().optional(),
        status: z.enum(["agendada", "em_andamento", "concluida", "cancelada"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, status, ...data } = input;

        const consultaAtual = await db.getConsultaById(id);
        if (!consultaAtual) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        const shouldFinalize =
          status === "concluida" &&
          (consultaAtual.status !== "concluida" || !consultaAtual.resumoEvolutivo);
        const updatePayload: Record<string, any> = { ...data };

        if (status) {
          updatePayload.status = status;
        }

        if (shouldFinalize) {
          const paciente = await db.getPacienteById(consultaAtual.pacienteId);
          if (!paciente) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
          }

          const consultasAnteriores = await drizzleDb
            .select()
            .from(consultas)
            .where(
              and(
                eq(consultas.pacienteId, consultaAtual.pacienteId),
                sql`${consultas.id} < ${consultaAtual.id}`
              )
            )
            .orderBy(desc(consultas.dataHora))
            .limit(1);

          const ultimaConsulta = consultasAnteriores[0];
          const resumoAnterior = ultimaConsulta?.resumoEvolutivo || null;

          const anamnese = (data.anamnese ?? consultaAtual.anamnese) as any;
          const exameFisico = (data.exameFisico ?? consultaAtual.exameFisico) as any;

          const dadosConsulta = {
            queixaPrincipal: anamnese?.queixaPrincipal,
            historiaDoencaAtual: anamnese?.hda || anamnese?.historiaDoencaAtual,
            antecedentesPessoais: anamnese?.antecedentesPessoais,
            antecedentesFamiliares: anamnese?.antecedentesFamiliares,
            exameFisico,
            hipotesesDiagnosticas: data.hipotesesDiagnosticas ?? consultaAtual.hipotesesDiagnosticas ?? undefined,
            conduta: data.conduta ?? consultaAtual.conduta ?? undefined,
            observacoes: data.observacoes ?? consultaAtual.observacoes ?? undefined,
          };

          const { ResumoEvolutivoService } = await import("./ai/ResumoEvolutivoService");

          const resultado = await ResumoEvolutivoService.gerarResumoConsolidado(
            {
              resumoAnterior,
              dadosNovaConsulta: dadosConsulta,
              pacienteNome: paciente.nome,
              dataConsulta: new Date(consultaAtual.dataHora).toLocaleDateString("pt-BR"),
            },
            ctx.user.id
          );

          updatePayload.resumoEvolutivo = resultado.resumoConsolidado;
        }

        const updated = await db.updateConsulta(id, updatePayload);
        return updated;
      }),

    generateSummary: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        // Importar o serviço de resumo
        const { generateConsultaSummary } = await import("./ai/services/consultaSummaryService");

        // Preparar dados para o serviço de IA
        const consultaData = {
          anamnese: consulta.anamnese as any,
          exameFisico: consulta.exameFisico as any,
          hipotesesDiagnosticas: consulta.hipotesesDiagnosticas || undefined,
          conduta: consulta.conduta || undefined,
          observacoes: consulta.observacoes || undefined,
        };

        // Gerar resumo com IA
        const resumo = await generateConsultaSummary(consultaData);

        })
      )
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        const { generateAbaSuggestions } = await import(
          "./ai/services/abaUpdateSuggestionService"
        );

        const contexto = {
          anamnese: consulta.anamnese as any,
          exameFisico: consulta.exameFisico as any,
          resumo: consulta.resumo as any,
          hipotesesDiagnosticas: consulta.hipotesesDiagnosticas || undefined,
          conduta: consulta.conduta || undefined,
        };

        const sugestoes = await generateAbaSuggestions(input.aba, contexto);

        return sugestoes;
      }),

    // Sincronização consolidada em único chamado à IA
    syncConsultaCompleta: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);

        if (!consulta) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        const paciente = await db.getPacienteById(consulta.pacienteId);
        const exames = await db.getExamesByPaciente(consulta.pacienteId);
        const bioimpedancias = await db.getBioimpedanciasByPaciente(consulta.pacienteId);
        const escores = await db.getEscoresByPaciente(consulta.pacienteId);

        const prompt = `Você é um assistente clínico de Endocrinologia.
Receba um pacote completo da consulta (HMA, exame físico, exames laboratoriais, bioimpedância, resumo prévio e escores já feitos) e devolva TODAS as respostas num único JSON com as chaves:
- anamnese: objeto com campos textuais atualizados (queixaPrincipal, hda, historicoPatologico, medicamentosEmUso, alergias, historicoFamiliar, habitosVida)
- exameFisico: objeto com campos atualizados (exameGeral, examePorSistemas ou exameEspecifico, sinais vitais se houver)
- exames: { resultados: [ { id, parametro, valor, unidade, referencia, status } ], notas?: string }
- escores: { sugeridos: [ { id, nome, categoria, motivoRelevancia, prioridade } ] }
- perfilMetabolico: { indices: [ { id, nome, categoria, valorCalculado, unidade, interpretacao, dadosUtilizados } ] }
- resumo: { markdown: string }
- avisos: string[]

Dados completos a seguir (pode responder "desconhecido" para campos faltantes):
PACIENTE: ${paciente?.nome ?? "Desconhecido"} (${paciente?.sexo ?? "?"}), ${paciente?.dataNascimento ?? "sem data"}
ANAMNESE: ${JSON.stringify(consulta.anamnese)}
EXAME FÍSICO: ${JSON.stringify(consulta.exameFisico)}
HIPÓTESES: ${consulta.hipotesesDiagnosticas ?? "não informadas"}
CONDUTA: ${consulta.conduta ?? "não informada"}
RESUMO ANTERIOR: ${consulta.resumoEvolutivo ?? "sem resumo"}
EXAMES LABORATORIAIS (todos os pacotes): ${JSON.stringify(exames)}
BIOIMPEDÂNCIA: ${JSON.stringify(bioimpedancias)}
ESCORES REALIZADOS: ${JSON.stringify(escores)}
`.trim();

        const schema = z.object({
          anamnese: z
            .object({
              queixaPrincipal: z.string().optional(),
              hda: z.string().optional(),
              historicoPatologico: z.string().optional(),
              medicamentosEmUso: z.string().optional(),
              alergias: z.string().optional(),
              historicoFamiliar: z.string().optional(),
              habitosVida: z.string().optional(),
            })
            .optional(),
          exameFisico: z
            .object({
              exameGeral: z.string().optional(),
              examePorSistemas: z.string().optional(),
              exameEspecifico: z.string().optional(),
              peso: z.string().optional(),
              altura: z.string().optional(),
              imc: z.string().optional(),
              pressaoArterial: z.string().optional(),
              frequenciaCardiaca: z.string().optional(),
              temperatura: z.string().optional(),
            })
            .optional(),
          exames: z
            .object({
              resultados: z
                .array(
                  z.object({
                    id: z.number().optional(),
                    parametro: z.string(),
                    valor: z.string().optional(),
                    unidade: z.string().optional(),
                    referencia: z.string().optional(),
                    status: z.string().optional(),
                  })
                )
                .optional(),
              notas: z.string().optional(),
            })
            .optional(),
          escores: z
            .object({
              sugeridos: z
                .array(
                  z.object({
                    id: z.string(),
                    nome: z.string(),
                    categoria: z.string().optional(),
                    motivoRelevancia: z.string().optional(),
                    prioridade: z.enum(["alta", "media", "baixa"]).optional(),
                  })
                )
                .optional(),
            })
            .optional(),
          perfilMetabolico: z
            .object({
              indices: z
                .array(
                  z.object({
                    id: z.string(),
                    nome: z.string(),
                    categoria: z.string().optional(),
                    valorCalculado: z.number().optional(),
                    unidade: z.string().optional(),
                    interpretacao: z.string().optional(),
                    dadosUtilizados: z.array(z.string()).optional(),
                  })
                )
                .optional(),
            })
            .optional(),
          resumo: z.object({ markdown: z.string().optional() }).optional(),
          avisos: z.array(z.string()).optional(),
        });

        const llmResponse = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pacote_consulta_completo",
              strict: true,
              schema: schema.toJSON(),
            },
          },
        });

        let parsed: any = {};
        try {
          parsed = schema.parse(JSON.parse(llmResponse.content));
        } catch (error) {
          parsed = {
            avisos: ["Falha ao interpretar resposta da IA. Dados originais mantidos."],
          };
        }

        return parsed;
      }),

    // MÓDULO 4: HIPÓTESES E CONDUTA
    updateHipotesesConduta: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          hipotesesDiagnosticas: z.string().optional().nullable(),
          conduta: z.string().optional().nullable(),
          observacoes: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { consultaId, hipotesesDiagnosticas, conduta, observacoes } = input;

        await db.updateConsulta(consultaId, {
          hipotesesDiagnosticas: hipotesesDiagnosticas ?? null,
          conduta: conduta ?? null,
          observacoes: observacoes ?? null,
        });

        return { success: true };
      }),

    atualizarHipotesesCondutaIA: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input }) => {
                        "guidelineReferencia",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["indices"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0].message.content as string;
        const parsed = JSON.parse(content);

        return parsed.indices;
      }),

    gerarReceituario: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          pacienteNome: z.string(),
          data: z.string(),
          assinatura: z.enum(["digital", "manual"]).default("digital"),
          medicamentos: z.array(
            z.object({
              nome: z.string(),
              dosagem: z.string(),
              via: z.string(),
              posologia: z.string(),
              duracao: z.string(),
            })
          ),
          instrucoesAdicionais: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        const { generateReceituarioPDF } = await import("./services/documentGenerator");

        const { pdfUrl, pdfPath } = await generateReceituarioPDF(
          {
            pacienteNome: input.pacienteNome,
            data: input.data,
            assinaturaTipo: input.assinatura,
            medicamentos: input.medicamentos,
            instrucoesAdicionais: input.instrucoesAdicionais,
          },
          consulta.pacienteId
        );

        return {
          pdfUrl,
          pdfPath,
          success: true,
        };
      }),

    gerarDocumento: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          tipo: z.enum(["atestado", "receita", "relatorio", "solicitacao_exame"]),
          conteudo: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
            resumo: null,
          };
        }

        // Importar resumo para a consulta atual
        await db.updateConsulta(consulta.id, {
          resumoEvolutivo: ultimaConsulta.resumoEvolutivo,
        });

        return {
          success: true,
          message: "Resumo importado com sucesso",
          resumo: ultimaConsulta.resumoEvolutivo,
        };
      }),
  }),

  // ========== EXAMES LABORATORIAIS ==========
  exames: router({
    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExamesByPaciente(input.pacienteId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        dataExame: z.date().optional(),
        tipo: z.string().optional(),
        laboratorio: z.string().optional(),
        resultados: z.array(z.object({
          id: z.number().optional(),
          parametro: z.string(),
          valor: z.string(),
          unidade: z.string().optional(),
          referencia: z.string().optional(),
          status: z.enum(["normal", "alterado", "critico"]).optional(),
        })).optional(),
        pdfPath: z.string().optional(),
        pdfUrl: z.string().optional(),
        imagemPath: z.string().optional(),
        imagemUrl: z.string().optional(),
        mimeType: z.string().optional(),
        fileName: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, resultados, ...rest } = input;
        const normalizedResultados = resultados ? normalizeResultados(resultados) : undefined;
        return await db.updateExameLaboratorial(id, {
          ...rest,
          resultados: normalizedResultados,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteExameLaboratorial(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        dataExame: z.date(),
        tipo: z.string().optional(),
        laboratorio: z.string().optional(),
        resultados: z.array(z.object({
          id: z.number().optional(),
          parametro: z.string(),
          valor: z.string(),
          unidade: z.string().optional(),
          referencia: z.string().optional(),
          status: z.enum(["normal", "alterado", "critico"]).optional(),
        })).optional(),
        pdfPath: z.string().optional(),
        pdfUrl: z.string().optional(),
        imagemPath: z.string().optional(),
        imagemUrl: z.string().optional(),
        mimeType: z.string().optional(),
        fileName: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExameLaboratorial({
          ...input,
          resultados: normalizeResultados(input.resultados),
        });
      }),
  }),

  // ========== BIOIMPEDÂNCIA ==========
  bioimpedancia: router({
    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBioimpedanciasByPaciente(input.pacienteId);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        dataAvaliacao: z.date(),
        resultados: z.any(),
        interpretacaoIA: z.string().optional(),
        pdfPath: z.string().optional(),
        pdfUrl: z.string().optional(),
        xlsPath: z.string().optional(),
        xlsUrl: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBioimpedancia(input);
      }),
  }),

  // ========== ESCORES CLÍNICOS ==========
  escores: router({
    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEscoresByPaciente(input.pacienteId);
      }),

    buscarCatalogo: protectedProcedure
      .input(
        z.object({
          termo: z.string().optional(),
          limit: z.number().default(15),
        })
      )
      .query(async ({ input }) => {
        const termo = input.termo?.trim().toLowerCase();
        const custom = await db.listEscoreModulos();
        const base = [
          ...ESCORES_CATALOGO,
          ...custom.map((m) => ({
            id: `custom-${m.id}`,
            nome: m.nome,
            categoria: m.categoria ?? "custom",
            descricao: m.descricao ?? "Escore criado via IA", 
            variaveisPrincipais: (m.parametrosNecessarios as string[]) ?? [],
            referencia: m.referencia ?? undefined,
          })),
        ];

        if (!termo) {
          return base.slice(0, input.limit);
        }

        return base
          .filter((item) => {
            const alvo = `${item.nome} ${item.categoria} ${item.descricao}`.toLowerCase();
            return alvo.includes(termo);
          })
          .slice(0, input.limit);
      }),

    listarModulos: protectedProcedure.query(async () => {
      const custom = await db.listEscoreModulos();
      return {
        base: ESCORES_CATALOGO,
        custom: custom.map((m) => ({
          id: m.id,
          nome: m.nome,
          descricao: m.descricao,
          parametrosNecessarios: m.parametrosNecessarios,
          referencia: m.referencia,
          categoria: m.categoria ?? "custom",
          criadoViaIA: m.criadoViaIA,
          faixasInterpretacao: m.faixasInterpretacao,
        })),
      };
    }),

    solicitarModuloIA: protectedProcedure
      .input(
        z.object({
          nome: z.string(),
          descricao: z.string().optional(),
          parametrosNecessarios: z.array(z.string()).optional(),
          categoria: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Você é a IA mestre responsável por criar um novo escore clínico. Nome: ${input.nome}. Descrição: ${
          input.descricao ?? "sem descrição"
        }. Liste parâmetros, referências bibliográficas, faixas de corte e interpretações resumidas em JSON.`;

        let parsed: any = null;
        try {
          const llmResponse = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
          parsed = JSON.parse(llmResponse.content);
        } catch (error) {
          parsed = {
            parametros: input.parametrosNecessarios ?? [],
            referencia: "Referência sugerida pela IA mestre (stub)",
            faixas: [],
            interpretacao: "Escore incorporado via requisição de módulo.",
          };
        }

        const modulo = await db.createEscoreModulo({
          nome: input.nome,
          descricao: input.descricao ?? parsed?.descricao ?? "Módulo criado via IA mestre",
          categoria: input.categoria ?? parsed?.categoria ?? "custom",
          parametrosNecessarios: parsed?.parametros ?? input.parametrosNecessarios ?? [],
          referencia: parsed?.referencia ?? "Referência em revisão",
          faixasInterpretacao: parsed?.faixas ?? [],
          criadoViaIA: true,
        });

        return modulo;
      }),

    calcularAutomatizados: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          consultaId: z.number().optional(),
          tipos: z
            .array(
              z.enum([
                "findrisc",
                "framingham",
                "homa-ir",
                "tyg-index",
                "tfg",
              ])
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const consulta = input.consultaId ? await db.getConsultaById(input.consultaId) : null;
        const pacienteId = input.pacienteId || consulta?.pacienteId;
        if (!pacienteId) {
          throw new Error("Paciente não encontrado para cálculo de escores");
        }

        const paciente = await db.getPacienteById(pacienteId);
        const exames = await db.getExamesByPaciente(pacienteId);
        const ultimoExame = exames[0];
        const bioimpedancias = await db.getBioimpedanciasByPaciente(pacienteId);
        const bio = bioimpedancias[0];

        let dadosLab: any = null;
        if (ultimoExame?.resultados) {
          try {
            dadosLab = typeof ultimoExame.resultados === "string"
              ? JSON.parse(ultimoExame.resultados as string)
              : ultimoExame.resultados;
          } catch {
            dadosLab = null;
          }
        }

        const parseNumber = (v: any): number | null => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };

        const parsePressao = (valor?: string | null) => {
          if (!valor) return null;
          const match = valor.match(/(\d{2,3})\/(\d{2,3})/);
          if (!match) return null;
          return parseNumber(match[1]);
        };

        const idade = paciente?.dataNascimento
          ? Math.floor((Date.now() - new Date(paciente.dataNascimento).getTime()) / (365.25 * 24 * 3600 * 1000))
          : undefined;

        const ctx = montarEscoreContexto({
          idade,
          sexo: paciente?.sexo ?? "",
          peso: (consulta?.exameFisico as any)?.peso ?? (bio?.resultados as any)?.peso ?? null,
          altura: (consulta?.exameFisico as any)?.altura ?? (bio?.resultados as any)?.altura ?? null,
          circunferencia:
            (consulta?.exameFisico as any)?.circunferenciaAbdominal ?? (bio?.resultados as any)?.circunferenciaAbdominal ?? null,
          pressaoSistolica: parsePressao((consulta?.exameFisico as any)?.pressaoArterial),
          glicemia: dadosLab ? parseNumber(dadosLab.glicemia) : null,
          hba1c: dadosLab ? parseNumber(dadosLab.hba1c) : null,
          colesterolTotal: dadosLab ? parseNumber(dadosLab.colesterolTotal) : null,
          ldl: dadosLab ? parseNumber(dadosLab.ldl) : null,
          hdl: dadosLab ? parseNumber(dadosLab.hdl) : null,
          triglicerideos: dadosLab ? parseNumber(dadosLab.triglicerideos) : null,
          insulina: dadosLab ? parseNumber(dadosLab.insulina) : null,
          creatinina: dadosLab ? parseNumber(dadosLab.creatinina ?? dadosLab.creatininaSerica) : null,
          tabagismo: (consulta?.anamnese as any)?.habitosDeVida?.toLowerCase?.().includes("fuma"),
          diabetes: (consulta?.hipotesesDiagnosticas ?? "").toLowerCase().includes("diabet"),
        });

        const calculados = calcularEscoresPadrao(ctx).filter((item) => {
          if (!input.tipos) return true;
          return input.tipos.includes(item.tipoEscore as any);
        });

        const salvos = [] as any[];
        for (const esc of calculados) {
          const registro = await db.createEscoreClinico({
            pacienteId,
            consultaId: input.consultaId ?? consulta?.id,
            tipoEscore: esc.tipoEscore,
            dataCalculo: new Date(),
            parametros: esc.parametrosUsados,
            resultado: esc.resultado,
            interpretacao: esc.interpretacao,
          });
          salvos.push({ ...registro, faltantes: esc.faltantes });
        }

        return {
          gerados: salvos,
          contexto: ctx,
        };
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        tipoEscore: z.string(),
        dataCalculo: z.date(),
        parametros: z.any().optional(),
        resultado: z.any(),
        interpretacao: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createEscoreClinico(input);
      }),
  }),

  // ========== PLANOS TERAPÊUTICOS ==========
  planos: router({
    getByConsulta: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanosByConsulta(input.consultaId);
      }),

    create: protectedProcedure
        nome: z.string().optional(),
        tipo: z.enum(["anamnese", "exame_fisico", "fluxo_doenca"]).optional(),
        patologia: z.string().optional(),
        definicao: z.any().optional(),
        documentosReferencia: z.any().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateTemplate(id, data);
      }),
  }),

  // ========== DOCUMENTOS ==========
  documentos: router({
    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentosByPaciente(input.pacienteId);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        tipo: z.enum(["atestado", "declaracao", "relatorio", "encaminhamento", "laudo", "pts"]),
        titulo: z.string(),
        conteudoHTML: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createDocumento({
          ...input,
          medicoId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        conteudoHTML: z.string().optional(),
        pdfPath: z.string().optional(),
        pdfUrl: z.string().optional(),
        status: z.enum(["rascunho", "finalizado"]).optional(),
        tipo: z.enum(["atestado", "declaracao", "relatorio", "encaminhamento", "laudo", "receituario", "pts"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDocumento(id, data);
      }),
  }),

  // ========== IA (INTELIGÊNCIA ARTIFICIAL) ==========
  ia: router({
    processarAnamnese: protectedProcedure
      .input(z.object({
        audioBlob: z.string(), // Base64 do áudio
        pacienteId: z.number(),
        patientContext: z.object({
          nome: z.string(),
          idade: z.number().optional(),
          sexo: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. Converter base64 para buffer
          const audioBuffer = Buffer.from(input.audioBlob, 'base64');
          
          // 2. Upload para S3
          const { url: audioUrl } = await storagePut(audioKey, audioBuffer, 'audio/webm');
          
          // 3. Processar com IA
          const result = await aiOrchestrator.execute('anamnese', {
            serviceType: 'anamnese',
            userId: ctx.user.id,
            patientId: input.pacienteId,
            data: {
              audioUrl,
              patientContext: input.patientContext,
            },
          });
          
          return result;
        } catch (error) {
          console.error('[IA] Erro ao processar anamnese:', error);
          throw new Error('Erro ao processar anamnese com IA');
        }
      }),

    processarExameLab: protectedProcedure
      .input(z.object({
        imageBlob: z.string(), // Base64 da imagem do exame
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        mimeType: z.string().optional(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. Converter base64 para buffer
          const imageBuffer = Buffer.from(input.imageBlob, 'base64');

          // 2. Upload para S3
          const contentType = input.mimeType || 'application/octet-stream';
          const extensionFromName = input.fileName?.split('.').pop();
          const normalizedExt = extensionFromName ? extensionFromName.toLowerCase() : 'bin';
          const imageKey = `exames/${ctx.user.id}/${Date.now()}.${normalizedExt}`;
          const { url: imageUrl } = await storagePut(imageKey, imageBuffer, contentType);
          
          // 3. Processar com IA
          const { ExamesLabService } = await import('./ai/services/exames');
          const tentarProcessar = async () => {
            const result = await ExamesLabService.process({
              imageUrl,
              userId: ctx.user.id,
              patientId: input.pacienteId
            });
            if (!result.success) {
              throw new Error(result.error || 'Erro ao processar exame');
            }
            return result;
          };

          let result;
          try {
            result = await tentarProcessar();
          } catch (err) {
            // Reprocessa uma segunda vez em caso de falha transitória
            result = await tentarProcessar();
          }

          // 4. Salvar no banco de dados
          const exame = await db.createExameLaboratorial({
            pacienteId: input.pacienteId,
            consultaId: input.consultaId,
            dataExame: new Date(result.data!.dataColeta),
            tipo: result.data!.tipoExame,
            laboratorio: result.data!.laboratorio,
            resultados: normalizeResultados(result.data!.valores.map((valor) => ({
              ...valor,
              referencia: valor.valorReferencia,
            }))),
            imagemPath: imageKey,
            imagemUrl: imageUrl,
            mimeType: contentType,
            fileName: input.fileName,
          });
          
          return {
            success: true,
            exame,
            dadosExtraidos: result.data,
          };
        } catch (error) {
          console.error('[IA] Erro ao processar exame laboratorial:', error);
          throw new Error('Erro ao processar exame laboratorial com IA');
        }
      }),

    gerarPTS: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        const paciente = await db.getPacienteById(consulta.pacienteId);
        const promptBase = `${
          `PROMPT – IA MESTRA DO MÓDULO DE MEV E PLANO TERAPÊUTICO SINGULAR\n` +
          `Você é a IA Mestra do sistema de prontuário inteligente do Dr. Rafael Lara.\n` +
          `Sua função é interpretar dados clínicos, selecionar ferramentas de MEV e gerar um Plano Terapêutico Singular (PTS) claro para o paciente.\n` +
          `Siga o layout: Diagnósticos em linguagem simples; Tratamentos instituídos (medicações, doses); Recomendações de alimentação, exercício, sono, estresse, substâncias; Ferramentas de MEV selecionadas (com grau de indicação e forma de aplicar); Pontos a melhorar; Metas de curto e médio prazo (mensuráveis); Orientações diárias personalizadas; Checklist de adesão; Cronograma de seguimento (retorno, exames a repetir, sinais de alarme).\n` +
          `Escreva com frases curtas, empatia e sem jargões. O médico poderá editar antes de imprimir.\n`
        }`;

        const dadosConsulta = {
          paciente: {
            nome: paciente?.nome,
            idade: paciente?.dataNascimento
              ? Math.max(
                  0,
                  new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
                )
              : undefined,
            sexo: paciente?.sexo,
          },
          anamnese: consulta.anamnese,
          exameFisico: consulta.exameFisico,
          exames: consulta.examesLaboratoriais,
          bioimpedancia: consulta.bioimpedancia,
          resumo: consulta.resumo,
          metas: consulta.observacoes,
          conduta: consulta.conduta,
          hipoteses: consulta.hipotesesDiagnosticas,
        };

        const prompt = `${promptBase}\nDados estruturados da consulta:\n${JSON.stringify(
          dadosConsulta,
          null,
          2
        )}`;

        const llmResponse = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        const conteudo = llmResponse.content || "";

        const documento = await db.createDocumento({
          pacienteId: consulta.pacienteId,
          consultaId: consulta.id,
          medicoId: ctx.user.id,
          tipo: "pts",
          titulo: "Plano Terapêutico Singular",
          conteudoHTML: conteudo,
          status: "rascunho",
        });

        return { success: true, conteudo, documentoId: documento.id };
      }),
  }),

  // ========== BIOIMPEDÂNCIA ==========
  bioimpedancias: router({
    list: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBioimpedanciasByPaciente(input.pacienteId);
      }),
    
    listAll: protectedProcedure
      .input(z.object({ 
        page: z.number().default(1),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        const bioimpedancias = await db.getAllBioimpedancias(input.limit, offset);
        const total = await db.countBioimpedancias();
        
        return {
          items: bioimpedancias,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        const consulta = await db.getConsultaById(consultaId);

        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        const anamnese = consulta.anamnese as any;
        const exameFisico = consulta.exameFisico as any;

        const prompt = `
Você é um médico especialista em Endocrinologia.
Com base nas informações abaixo da consulta, sugira melhorias para o EXAME FÍSICO:

- Queixa principal: ${anamnese?.queixaPrincipal ?? "não informada"}
- HDA: ${anamnese?.hda ?? "não informada"}
- Exame geral atual: ${exameFisico?.exameGeral ?? "não preenchido"}
- Exame por sistemas atual: ${exameFisico?.examePorSistemas ?? "não preenchido"}
- Peso: ${exameFisico?.peso ?? "não informado"}
- Altura: ${exameFisico?.altura ?? "não informada"}
- IMC: ${exameFisico?.imc ?? "não informado"}
- Pressão arterial: ${exameFisico?.pressaoArterial ?? "não informada"}

Retorne um JSON com um array chamado "sugestoes", onde cada item tem:
{
  "id": "string",
  "tipo": "exame_geral" | "exame_sistemas" | "exame_especifico",
  "titulo": "string",
  "textoSugerido": "string",
  "fundamentacao": "string",
  "prioridade": "alta" | "media" | "baixa",
  "pontosAtencao": ["string", ...],
  "campos": [
    {
      "id": "string",
      "label": "string",
      "placeholder": "string"
    }
  ]
}

Quando "tipo" for "exame_especifico", descreva claramente qual teste/avaliação deve ser feito e forneça pelo menos um campo em "campos" para que o médico possa preencher o resultado do exame sugerido.
        `.trim();

        const llmResponse = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sugestoes_exame_fisico",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  sugestoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        tipo: {
                          type: "string",
                          enum: ["exame_geral", "exame_sistemas", "exame_especifico"],
                        },
                        titulo: { type: "string" },
                        textoSugerido: { type: "string" },
                        fundamentacao: { type: "string" },
                        prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                        pontosAtencao: { type: "array", items: { type: "string" } },
                        campos: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              placeholder: { type: "string" },
                            },
                            required: ["label"],
                            additionalProperties: false,
                          },
                          nullable: true,
                        },
                      },
                      required: [
                        "id",
                        "tipo",
                        "titulo",
                        "textoSugerido",
                        "fundamentacao",
                        "prioridade",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["sugestoes"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0].message.content as string;
        const parsed = JSON.parse(content || "{}");
        const sugestoes = parsed.sugestoes || [];

        await db.updateConsulta(consultaId, {
          sugestoesExameFisico: sugestoes,
        });

        return { success: true, sugestoes };
      }),

    // MÓDULO 2: Atualizar/remover sugestões
    atualizarSugestoes: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          sugestoes: z.array(z.any()),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateConsulta(input.consultaId, {
          sugestoesExameFisico: input.sugestoes.length > 0 ? input.sugestoes : null,
        });

        return { success: true };
      }),

    // MÓDULO 6: Histórico de documentos
    salvarDocumento: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          pacienteId: z.number(),
          tipo: z.enum(["receituario", "atestado", "relatorio", "declaracao", "encaminhamento", "laudo", "pts"]),
          titulo: z.string().min(1),
          pdfUrl: z.string().min(1),
          pdfPath: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.createDocumento({
          ...input,
          medicoId: ctx.user.id,
        });

        return { success: true };
      }),

    listarDocumentos: protectedProcedure
      .input(
        z.object({
          consultaId: z.number().optional(),
          pacienteId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        if (input.consultaId) {
          // Busca todos os documentos do paciente e filtra por consultaId
          const docs = await db.getDocumentosByPaciente(input.consultaId);
