import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { pacientes, consultas } from "../drizzle/schema";
import * as db from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = mysql.createPool(process.env.DATABASE_URL!);
const drizzleDb = drizzle(connection);
import { aiOrchestrator } from "./ai/orchestrator";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

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
        or(
          like(pacientes.nome, pattern),
          like(pacientes.cpf, pattern),
          like(pacientes.contatoWhatsapp, pattern)
        )
      )
      .limit(limitPacientes);

    // CONSULTAS (com nome do paciente)
    const consultasResult = await drizzleDb
      .select({
        id: consultas.id,
        dataHora: consultas.dataHora,
        anamnese: consultas.anamnese,
        pacienteId: consultas.pacienteId,
        pacienteNome: pacientes.nome,
      })
      .from(consultas)
      .leftJoin(pacientes, eq(consultas.pacienteId, pacientes.id))
      .where(
        or(
          like(pacientes.nome, pattern),
          sql`JSON_EXTRACT(${consultas.anamnese}, '$.queixaPrincipal') LIKE ${pattern}`
        )
      )
      .orderBy(desc(consultas.dataHora))
      .limit(limitConsultas);

    // Extrair queixa principal do JSON
    const consultasComQueixa = consultasResult.map((c: any) => {
      let queixaPrincipal = "Sem queixa registrada";
      if (c.anamnese) {
        try {
          const anamnese = typeof c.anamnese === 'string' ? JSON.parse(c.anamnese) : c.anamnese;
          queixaPrincipal = anamnese.queixaPrincipal || "Sem queixa registrada";
        } catch {
          // Ignora erro de parsing
        }
      }
      return {
        id: c.id,
        dataHora: c.dataHora,
        queixaPrincipal,
        pacienteId: c.pacienteId,
        pacienteNome: c.pacienteNome,
      };
    });

    return {
      pacientes: pacientesResult,
      consultas: consultasComQueixa,
    };
  });

export const appRouter = router({
  system: systemRouter,
  buscaGlobal: buscaGlobalProcedure,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== PACIENTES ==========
  pacientes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPacientesByMedico(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPacienteById(input.id);
      }),

    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.searchPacientes(ctx.user.id, input.searchTerm);
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        cpf: z.string().optional(),
        dataNascimento: z.date().optional(),
        sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
        contatoWhatsapp: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        dadosEssenciais: z.any().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createPaciente({
          ...input,
          medicoId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        cpf: z.string().optional(),
        dataNascimento: z.date().optional(),
        sexo: z.enum(["masculino", "feminino", "outro"]).optional(),
        contatoWhatsapp: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        endereco: z.string().optional(),
        dadosEssenciais: z.any().optional(),
        observacoes: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePaciente(id, data);
      }),
  }),

  // ========== CONSULTAS ==========
  consultas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getConsultasByMedico(ctx.user.id);
    }),

    listRecent: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ ctx, input }) => {
        return await db.getConsultasRecentes(ctx.user.id, input.limit);
      }),

    listEmAberto: protectedProcedure.query(async ({ ctx }) => {
      return await db.getConsultasEmAberto(ctx.user.id);
    }),

    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getConsultasByPaciente(input.pacienteId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getConsultaById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        dataHora: z.date(),
        audioPath: z.string().optional(),
        audioUrl: z.string().optional(),
        anamnese: z.any().optional(),
        exameFisico: z.any().optional(),
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateConsulta(id, data);
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

        // Salvar resumo na consulta
        await db.updateConsulta(input.consultaId, { resumo });

        return resumo;
      }),

    syncHmaWithAI: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        const { generateExameFisicoSuggestions } = await import(
          "./ai/services/exameFisicoSuggestionService"
        );

        const anamnese = consulta.anamnese as any;
        const anamneseData = {
          queixaPrincipal: anamnese?.queixaPrincipal,
          hda: anamnese?.historiaDoencaAtual || anamnese?.hda,
          historicoPatologico: anamnese?.historicoPatologico,
          medicamentosEmUso: anamnese?.medicamentosEmUso,
          alergias: anamnese?.alergias,
          historicoFamiliar: anamnese?.historicoFamiliar,
          habitosVida: anamnese?.habitosVida,
        };

        const sugestoes = await generateExameFisicoSuggestions(anamneseData);

        // Salvar sugestões no exame físico
        const exameFisicoAtual = (consulta.exameFisico as any) || {};
        await db.updateConsulta(input.consultaId, {
          exameFisico: {
            ...exameFisicoAtual,
            sugestoesIA: sugestoes,
          },
        });

        return sugestoes;
      }),

    getAbaSuggestions: protectedProcedure
      .input(
        z.object({
          consultaId: z.number(),
          aba: z.enum(["hma", "exame_fisico", "resumo", "hipoteses", "plano"]),
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
        const { consultaId } = input;

        const consulta = await db.getConsultaById(consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        // Parsear anamnese e exame físico
        const anamnese = consulta.anamnese as any;
        const exameFisico = consulta.exameFisico as any;

        // Tentar parsear resumo se existir
        let resumo: any = null;
        if (consulta.resumo) {
          try {
            resumo = typeof consulta.resumo === 'string'
              ? JSON.parse(consulta.resumo as string)
              : consulta.resumo;
          } catch {
            resumo = null;
          }
        }

        const prompt = `
Você é um médico endocrinologista, atuando em APS, familiarizado com boas práticas de documentação de prontuários.

Com base nos dados abaixo, atualize HIPÓTESES DIAGNÓSTICAS, PLANO TERAPÊUTICO E ORIENTAÇÕES AO PACIENTE.

DADOS DA CONSULTA:
- Queixa principal: ${anamnese?.queixaPrincipal ?? "não informada"}
- HMA / História: ${anamnese?.hda ?? anamnese?.historiaDoencaAtual ?? "não informada"}
- Exame físico (geral): ${exameFisico?.exameGeral ?? "não informado"}
- Exame físico (por sistemas): ${exameFisico?.examePorSistemas ?? exameFisico?.exameEspecifico ?? "não informado"}

RESUMO ESTRUTURADO (se disponível):
- Principais queixas: ${resumo?.principaisQueixas ?? "não informado"}
- Achados relevantes: ${resumo?.achadosRelevantes?.join("; ") ?? "não informado"}
- Hipóteses diagnósticas (resumo): ${resumo?.hipotesesDiagnosticas?.join("; ") ?? "não informado"}
- Condutas propostas (resumo): ${resumo?.condutasPropostas?.join("; ") ?? "não informado"}

HIPÓTESES / PLANO / ORIENTAÇÕES ATUAIS NO PRONTUÁRIO:
- Hipóteses atuais: ${consulta.hipotesesDiagnosticas ?? "não preenchidas"}
- Plano terapêutico atual: ${consulta.conduta ?? "não preenchido"}
- Orientações atuais: ${consulta.observacoes ?? "não preenchidas"}

TAREFA:
1. Refine ou reescreva as HIPÓTESES DIAGNÓSTICAS de forma organizada, podendo usar tópicos ou parágrafos curtos.
2. Monte um PLANO TERAPÊUTICO claro, objetivo e exequível, adequado ao cenário ambulatorial de endocrinologia.
3. Escreva ORIENTAÇÕES AO PACIENTE em linguagem clara, mas ainda técnica, que possam ser registradas no prontuário.

Retorne um JSON com o formato:
{
  "hipotesesDiagnosticas": "texto livre, em parágrafos ou tópicos",
  "conduta": "texto livre estruturado",
  "observacoes": "texto livre com orientações ao paciente"
}
`.trim();

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um assistente especializado em documentação médica endocrinológica." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hipoteses_conduta",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  hipotesesDiagnosticas: { type: "string" },
                  conduta: { type: "string" },
                  observacoes: { type: "string" },
                },
                required: ["hipotesesDiagnosticas", "conduta", "observacoes"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0].message.content as string;
        const parsed = JSON.parse(content);

        // Salvar no banco
        await db.updateConsulta(consultaId, {
          hipotesesDiagnosticas: parsed.hipotesesDiagnosticas,
          conduta: parsed.conduta,
          observacoes: parsed.observacoes,
        });

        return {
          success: true,
          hipotesesDiagnosticas: parsed.hipotesesDiagnosticas,
          conduta: parsed.conduta,
          observacoes: parsed.observacoes,
        };
      }),

    // MÓDULO 5: PERFIL METABÓLICO
    getUltimosExames: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        const exames = await db.getExamesByPaciente(input.pacienteId);

        if (exames.length === 0) return null;

        // Pegar o último exame
        const exame = exames[0];

        let dados: any = {};
        if (exame.resultados) {
          try {
            dados = typeof exame.resultados === 'string'
              ? JSON.parse(exame.resultados as string)
              : exame.resultados;
          } catch {
            dados = {};
          }
        }

        const toNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          const n = Number(value);
          return Number.isFinite(n) ? n : null;
        };

        return {
          dataExame: exame.dataExame,
          glicemia: toNumber(dados.glicemia),
          hba1c: toNumber(dados.hba1c),
          colesterolTotal: toNumber(dados.colesterolTotal),
          ldl: toNumber(dados.ldl),
          hdl: toNumber(dados.hdl),
          triglicerideos: toNumber(dados.triglicerideos),
          insulina: toNumber(dados.insulina),
          tsh: toNumber(dados.tsh),
          t4Livre: toNumber(dados.t4Livre),
          bruto: dados,
        };
      }),

    sugerirIndicesMetabolicos: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .query(async ({ input }) => {
        const { consultaId } = input;

        const consulta = await db.getConsultaById(consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        // Buscar último exame do paciente
        const exames = await db.getExamesByPaciente(consulta.pacienteId);
        const ultimoExame = exames[0];

        let dadosLab: any = null;
        if (ultimoExame?.resultados) {
          try {
            dadosLab = typeof ultimoExame.resultados === 'string'
              ? JSON.parse(ultimoExame.resultados as string)
              : ultimoExame.resultados;
          } catch {
            dadosLab = null;
          }
        }

        // Parsear anamnese e exame físico
        const anamnese = consulta.anamnese as any;
        const exameFisico = consulta.exameFisico as any;

        // Tentar parsear resumo se existir
        let resumo: any = null;
        if (consulta.resumo) {
          try {
            resumo = typeof consulta.resumo === 'string'
              ? JSON.parse(consulta.resumo as string)
              : consulta.resumo;
          } catch {
            resumo = null;
          }
        }

        const prompt = `
Você é um médico endocrinologista e internista, habituado a interpretar exames laboratoriais complexos e a utilizar índices/razões/escores para estratificação de risco e avaliação metabólica.

TAREFA:
A partir do QUADRO CLÍNICO e do PERFIL LABORATORIAL abaixo, selecione quais ÍNDICES METABÓLICOS, RAZÕES OU COMBINAÇÕES DE MARCADORES são mais RELEVANTES para este paciente.

CONDIÇÕES:
- Considere que a literatura dispõe de MUITOS índices e relações validadas (muito mais que 20), incluindo índices de resistência insulínica, índices lipídicos compostos, índices para esteatose hepática, índices de risco cardiometabólico, etc.
- NÃO liste todos os índices que existem. Selecione apenas aqueles que realmente agregam valor clínico para ESTE quadro específico.
- Quando possível, utilize os valores laboratoriais fornecidos para calcular ou estimar o valor do índice e propor uma interpretação.
- Use como base conceitual as diretrizes e consensos mais recentes de: Endocrinologia, Cardiologia, Nefrologia, Hepatologia, Obesidade, Medicina Interna, etc.
- Se os dados disponíveis forem insuficientes para um determinado índice, você pode sugeri-lo, mas deixe claro que o cálculo exato não foi possível e quais dados faltam.

QUADRO CLÍNICO (texto de prontuário):
- Queixa principal: ${anamnese?.queixaPrincipal ?? "não informada"}
- HMA / História detalhada: ${anamnese?.hda ?? anamnese?.historiaDoencaAtual ?? "não informada"}
- Hipóteses diagnósticas registradas: ${consulta.hipotesesDiagnosticas ?? "não informadas"}
- Exame físico geral: ${exameFisico?.exameGeral ?? "não informado"}
- Exame por sistemas: ${exameFisico?.examePorSistemas ?? exameFisico?.exameEspecifico ?? "não informado"}

RESUMO ESTRUTURADO (caso exista):
- Principais queixas: ${resumo?.principaisQueixas ?? "não informado"}
- Achados relevantes: ${resumo?.achadosRelevantes?.join("; ") ?? "não informado"}
- Hipóteses (resumo): ${resumo?.hipotesesDiagnosticas?.join("; ") ?? "não informado"}
- Condutas (resumo): ${resumo?.condutasPropostas?.join("; ") ?? "não informado"}

LABORATÓRIO (último exame disponível, bruto):
${dadosLab ? JSON.stringify(dadosLab, null, 2) : "Nenhum dado laboratorial estruturado disponível."}

RETORNO ESPERADO:
Forneça um JSON com o formato EXATO abaixo:

{
  "indices": [
    {
      "id": "string-curta-para-identificar-o-indice",
      "nome": "Nome do índice ou relação metabólica",
      "categoria": "controle-glicemico | resistencia-insulinica | perfil-lipidico | risco-cardiometabolico | esteatose-hepatica | obesidade | outros",
      "valorCalculado": 0,
      "unidade": "string ou null",
      "interpretacao": "Explique o que este valor significa clinicamente para ESTE paciente",
      "motivoRelevancia": "Explique por que este índice é importante no contexto deste quadro clínico, relacionando com diagnóstico, sintomas e exames",
      "dadosUtilizados": [
        "Liste os dados laboratoriais e clínicos usados para este índice"
      ],
      "guidelineReferencia": "Cite de forma concisa a diretriz ou estudo base (ex.: 'Diretriz de dislipidemia 202X', 'Consenso de resistência insulínica 202X', etc.)"
    }
  ]
}

REGRAS ADICIONAIS:
- Limite-se a cerca de 3 a 7 índices por paciente, focando nos que realmente mudam conduta ou refinam estratificação de risco.
- Se não houver dados suficientes, retorne um array vazio ("indices": []).
- Se algum valor não puder ser calculado com segurança, defina "valorCalculado" como null e explique na "interpretacao" e "dadosUtilizados" o que falta.
`.trim();

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um assistente especializado em medicina metabólica e endocrinologia." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "indices_metabolicos",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  indices: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        nome: { type: "string" },
                        categoria: {
                          type: "string",
                          enum: [
                            "controle-glicemico",
                            "resistencia-insulinica",
                            "perfil-lipidico",
                            "risco-cardiometabolico",
                            "esteatose-hepatica",
                            "obesidade",
                            "outros",
                          ],
                        },
                        valorCalculado: { type: ["number", "null"] },
                        unidade: { type: ["string", "null"] },
                        interpretacao: { type: "string" },
                        motivoRelevancia: { type: "string" },
                        dadosUtilizados: {
                          type: "array",
                          items: { type: "string" },
                        },
                        guidelineReferencia: { type: "string" },
                      },
                      required: [
                        "id",
                        "nome",
                        "categoria",
                        "valorCalculado",
                        "unidade",
                        "interpretacao",
                        "motivoRelevancia",
                        "dadosUtilizados",
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
        }

        // TODO: Implementar geração de outros tipos de documentos
        // Por enquanto, retorna placeholder
        return {
          pdfUrl: "",
          pdfPath: "",
          success: false,
          message: "Tipo de documento ainda não implementado",
        };
      }),

    // MÓDULO 8: Últimas consultas do paciente
    getUltimasConsultas: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          limit: z.number().default(5),
        })
      )
      .query(async ({ input }) => {
        const { pacienteId, limit } = input;

        // Busca todas as consultas do paciente e ordena por data
        const todasConsultas = await db.getConsultasByPaciente(pacienteId);
        
        // Ordena por dataHora decrescente e limita
        const ultimasConsultas = todasConsultas
          .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
          .slice(0, limit);

        return ultimasConsultas;
      }),

    // MÓDULO: RESUMO EVOLUTIVO INTELIGENTE
    gerarResumoEvolutivo: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { ResumoEvolutivoService } = await import("./ai/ResumoEvolutivoService");
        
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        // Buscar última consulta do mesmo paciente (excluindo a atual)
        const consultasAnteriores = await drizzleDb
          .select()
          .from(consultas)
          .where(
            and(
              eq(consultas.pacienteId, consulta.pacienteId),
              sql`${consultas.id} < ${consulta.id}`
            )
          )
          .orderBy(desc(consultas.dataHora))
          .limit(1);

        const ultimaConsulta = consultasAnteriores[0];
        const resumoAnterior = ultimaConsulta?.resumoEvolutivo || null;

        // Buscar dados do paciente
        const paciente = await db.getPacienteById(consulta.pacienteId);
        if (!paciente) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        }

        // Preparar dados da consulta atual
        const anamnese = consulta.anamnese as any;
        const exameFisico = consulta.exameFisico as any;

        const dadosConsulta = {
          queixaPrincipal: anamnese?.queixaPrincipal,
          historiaDoencaAtual: anamnese?.hda || anamnese?.historiaDoencaAtual,
          antecedentesPessoais: anamnese?.antecedentesPessoais,
          antecedentesFamiliares: anamnese?.antecedentesFamiliares,
          exameFisico: exameFisico,
          hipotesesDiagnosticas: consulta.hipotesesDiagnosticas || undefined,
          conduta: consulta.conduta || undefined,
          observacoes: consulta.observacoes || undefined,
        };

        // Gerar resumo consolidado
        const resultado = await ResumoEvolutivoService.gerarResumoConsolidado(
          {
            resumoAnterior,
            dadosNovaConsulta: dadosConsulta,
            pacienteNome: paciente.nome,
            dataConsulta: new Date(consulta.dataHora).toLocaleDateString("pt-BR"),
          },
          ctx.user.id
        );

        // Salvar resumo evolutivo na consulta
        await db.updateConsulta(consulta.id, {
          resumoEvolutivo: resultado.resumoConsolidado,
        });

        return resultado;
      }),

    obterResumoEvolutivo: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .query(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        return {
          resumoEvolutivo: consulta.resumoEvolutivo || null,
          temResumo: !!consulta.resumoEvolutivo,
        };
      }),

    importarUltimoResumo: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);
        if (!consulta) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Consulta não encontrada" });
        }

        // Buscar última consulta do mesmo paciente (excluindo a atual)
        const consultasAnteriores = await drizzleDb
          .select()
          .from(consultas)
          .where(
            and(
              eq(consultas.pacienteId, consulta.pacienteId),
              sql`${consultas.id} < ${consulta.id}`
            )
          )
          .orderBy(desc(consultas.dataHora))
          .limit(1);

        const ultimaConsulta = consultasAnteriores[0];
        
        if (!ultimaConsulta || !ultimaConsulta.resumoEvolutivo) {
          return {
            success: false,
            message: "Nenhum resumo anterior encontrado",
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

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        consultaId: z.number().optional(),
        dataExame: z.date(),
        tipo: z.string().optional(),
        laboratorio: z.string().optional(),
        resultados: z.any().optional(),
        pdfPath: z.string().optional(),
        pdfUrl: z.string().optional(),
        imagemPath: z.string().optional(),
        imagemUrl: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createExameLaboratorial(input);
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
      .input(z.object({
        consultaId: z.number(),
        pacienteId: z.number(),
        versaoMedico: z.string().optional(),
        versaoPaciente: z.string().optional(),
        diagnosticosConfirmados: z.any().optional(),
        diagnosticosProvaveis: z.any().optional(),
        condutas: z.any().optional(),
        metasSMART: z.any().optional(),
        sinaisAlarme: z.any().optional(),
        recomendacoes: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPlanoTerapeutico(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        versaoMedico: z.string().optional(),
        versaoPaciente: z.string().optional(),
        diagnosticosConfirmados: z.any().optional(),
        diagnosticosProvaveis: z.any().optional(),
        condutas: z.any().optional(),
        metasSMART: z.any().optional(),
        sinaisAlarme: z.any().optional(),
        recomendacoes: z.any().optional(),
        pdfMedicoPath: z.string().optional(),
        pdfMedicoUrl: z.string().optional(),
        pdfPacientePath: z.string().optional(),
        pdfPacienteUrl: z.string().optional(),
        statusEnvioWhatsapp: z.enum(["pendente", "enviado", "erro"]).optional(),
        dataEnvioWhatsapp: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updatePlanoTerapeutico(id, data);
      }),
  }),

  // ========== TEMPLATES ==========
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTemplatesByMedico(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        tipo: z.enum(["anamnese", "exame_fisico", "fluxo_doenca"]),
        patologia: z.string().optional(),
        definicao: z.any(),
        documentosReferencia: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTemplate({
          ...input,
          medicoId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
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
        tipo: z.enum(["atestado", "declaracao", "relatorio", "encaminhamento", "laudo"]),
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
          const audioKey = `consultas/audio/${ctx.user.id}/${Date.now()}.webm`;
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
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // 1. Converter base64 para buffer
          const imageBuffer = Buffer.from(input.imageBlob, 'base64');
          
          // 2. Upload para S3
          const imageKey = `exames/${ctx.user.id}/${Date.now()}.jpg`;
          const { url: imageUrl } = await storagePut(imageKey, imageBuffer, 'image/jpeg');
          
          // 3. Processar com IA
          const { ExamesLabService } = await import('./ai/services/exames');
          const result = await ExamesLabService.process({ 
            imageUrl, 
            userId: ctx.user.id, 
            patientId: input.pacienteId 
          });
          
          if (!result.success) {
            throw new Error(result.error || 'Erro ao processar exame');
          }
          
          // 4. Salvar no banco de dados
          const exame = await db.createExameLaboratorial({
            pacienteId: input.pacienteId,
            consultaId: input.consultaId,
            dataExame: new Date(result.data!.dataColeta),
            tipo: result.data!.tipoExame,
            laboratorio: result.data!.laboratorio,
            resultados: result.data!.valores,
            imagemPath: imageKey,
            imagemUrl: imageUrl,
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
        };
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        dataAvaliacao: z.date(),
        resultados: z.any(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBioimpedancia(input);
      }),
    
    uploadExcel: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { BioimpedanciaParser } = await import('./services/BioimpedanciaParser');
        const { storagePut } = await import('./storage');
        
        // Converte base64 para buffer
        const buffer = Buffer.from(input.fileBase64, 'base64');
        
        // Faz upload do arquivo original para S3
        const fileKey = `bioimpedancia/${input.pacienteId}/${Date.now()}-${input.fileName}`;
        const { url: xlsUrl } = await storagePut(
          fileKey,
          buffer,
          'application/vnd.ms-excel'
        );
        
        // Faz parse do arquivo Excel
        const medicoes = BioimpedanciaParser.parseExcel(buffer);
        
        // Salva cada medição no banco de dados
        const bioimpedanciasSalvas = [];
        for (const medicao of medicoes) {
          const bioimpedancia = await db.createBioimpedancia({
            pacienteId: input.pacienteId,
            dataAvaliacao: medicao.dataAvaliacao,
            resultados: medicao,
            xlsUrl,
          });
          bioimpedanciasSalvas.push(bioimpedancia);
        }
        
        return {
          success: true,
          count: bioimpedanciasSalvas.length,
          bioimpedancias: bioimpedanciasSalvas,
        };
      }),
  }),

  // ========== INDICADORES METABÓLICOS ==========
  indicadores: router({
    getByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        return await db.getIndicadoresByPaciente(input.pacienteId);
      }),

    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        dataReferencia: z.date(),
        peso: z.number().optional(),
        altura: z.number().optional(),
        imc: z.number().optional(),
        circunferenciaAbdominal: z.number().optional(),
        pressaoArterialSistolica: z.number().optional(),
        pressaoArterialDiastolica: z.number().optional(),
        glicemiaJejum: z.number().optional(),
        hba1c: z.number().optional(),
        colesterolTotal: z.number().optional(),
        ldl: z.number().optional(),
        hdl: z.number().optional(),
        triglicerideos: z.number().optional(),
        dadosAdicionais: z.any().optional(),
        fontesDados: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createIndicadorMetabolico(input);
      }),
  }),

  // ========== MÓDULO 1: EXAME FÍSICO + SUGESTÕES IA ==========
  exameFisico: router({
    // Buscar sugestões de exame físico para uma consulta
    getSugestoes: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .query(async ({ input }) => {
        const consulta = await db.getConsultaById(input.consultaId);

        if (!consulta || !consulta.sugestoesExameFisico) {
          return [];
        }

        try {
          const parsed = consulta.sugestoesExameFisico as any;
          if (Array.isArray(parsed)) return parsed;
          return [parsed];
        } catch {
          return [];
        }
      }),

    // Atualizar exame físico da consulta
    atualizarExameFisico: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          exameFisico: z.any().optional(), // JSON com dados do exame físico
        })
      )
      .mutation(async ({ input }) => {
        await db.updateConsulta(input.id, {
          exameFisico: input.exameFisico,
        });

        return { success: true };
      }),

    // Gerar sugestões de exame físico com IA
    gerarSugestoes: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { consultaId } = input;

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
  "tipo": "exame_geral" | "exame_sistemas",
  "titulo": "string",
  "textoSugerido": "string",
  "fundamentacao": "string",
  "prioridade": "alta" | "media" | "baixa",
  "pontosAtencao": ["string", ...]
}
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
                        tipo: { type: "string", enum: ["exame_geral", "exame_sistemas"] },
                        titulo: { type: "string" },
                        textoSugerido: { type: "string" },
                        fundamentacao: { type: "string" },
                        prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                        pontosAtencao: { type: "array", items: { type: "string" } },
                      },
                      required: ["id", "tipo", "titulo", "textoSugerido", "fundamentacao", "prioridade"],
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
          tipo: z.enum(["receituario", "atestado", "relatorio", "declaracao", "encaminhamento", "laudo"]),
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
          return docs.filter((d: any) => d.consultaId === input.consultaId);
        }
        if (input.pacienteId) {
          return await db.getDocumentosByPaciente(input.pacienteId);
        }
        return [];
      }),

    // MÓDULO 9: Sugerir escores clínicos com IA
    sugerirEscores: protectedProcedure
      .input(z.object({ consultaId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { consultaId } = input;

        // 1. Buscar consulta
        const consulta = await db.getConsultaById(consultaId);
        if (!consulta) {
          throw new Error("Consulta não encontrada");
        }

        // 2. Buscar último exame laboratorial do paciente (se houver)
        let dadosLab: any = null;
        try {
          const exames = await db.getExamesByPaciente(consulta.pacienteId);
          if (exames.length > 0) {
            const ultimoExame = exames[0]; // Já vem ordenado por data
            if (ultimoExame.resultados) {
              dadosLab = typeof ultimoExame.resultados === 'string'
                ? JSON.parse(ultimoExame.resultados as string)
                : ultimoExame.resultados;
            }
          }
        } catch (e) {
          console.error("Erro ao buscar exames laboratoriais:", e);
        }

        // 3. Tentar parsear resumo estruturado
        let resumo: any = null;
        if (consulta.resumo) {
          try {
            resumo = typeof consulta.resumo === 'string'
              ? JSON.parse(consulta.resumo)
              : consulta.resumo;
          } catch {
            resumo = null;
          }
        }

        // 4. Prompt IA – orquestrador de escores
        const prompt = `
Você é um médico especialista em Endocrinologia, Metabologia e Medicina Interna, acostumado a utilizar escores de risco, índices clínicos e ferramentas prognósticas em cenário ambulatorial de alto volume.

TAREFA:
A partir do QUADRO CLÍNICO e do PERFIL LABORATORIAL abaixo, selecione quais ESCORES CLÍNICOS / FERRAMENTAS DE RISCO são mais relevantes para ESTE paciente, considerando que existem dezenas de escores disponíveis na literatura (muito mais do que 20).

CONDIÇÕES:
- NÃO liste todos os escores disponíveis.
- Selecione apenas aqueles que realmente agregam valor clínico para ESTE caso específico (estratificação de risco, decisão terapêutica, necessidade de screening adicional, etc.).
- Utilize como base conceitual as diretrizes mais recentes de:
  - Endocrinologia (DM, obesidade, tireoide, etc.)
  - Cardiologia (risco cardiovascular, dislipidemia, etc.)
  - Nefrologia (função renal, albuminuria)
  - Geriatria / fragilidade, quando pertinente
- NÃO é necessário calcular os escores numericamente neste momento; foque em quais escores considerar e o racional clínico.

QUADRO CLÍNICO (dados da consulta):
- Anamnese: ${JSON.stringify(consulta.anamnese) ?? "não informada"}
- Hipóteses diagnósticas: ${consulta.hipotesesDiagnosticas ?? "não informadas"}
- Exame físico: ${JSON.stringify(consulta.exameFisico) ?? "não informado"}

RESUMO ESTRUTURADO (se existir):
- Principais queixas: ${resumo?.principaisQueixas ?? "não informado"}
- Achados relevantes: ${resumo?.achadosRelevantes?.join("; ") ?? "não informado"}
- Hipóteses (resumo): ${resumo?.hipotesesDiagnosticas?.join("; ") ?? "não informado"}
- Condutas (resumo): ${resumo?.condutasPropostas?.join("; ") ?? "não informado"}

EXAMES LABORATORIAIS (último exame, bruto):
${dadosLab ? JSON.stringify(dadosLab, null, 2) : "Nenhum dado laboratorial estruturado disponível."}

RETORNO ESPERADO:
Responda EXCLUSIVAMENTE com um JSON no formato:

{
  "escores": [
    {
      "id": "string-curta-para-identificar-o-escore",
      "nome": "Nome completo do escore ou ferramenta",
      "categoria": "cardiovascular | metabolico | osseo | renal | hepatico | endocrino-outros | fragilidade | psiquiatrico | obesidade | riscos-medicamentosos | outros",
      "contextoClinico": "Explique em 2-3 frases em que situação este escore é especialmente relevante neste paciente específico",
      "motivoRelevancia": "Explique por que este escore deveria ser considerado, relacionando com idade, comorbidades, sintomas, achados físicos e laboratoriais disponíveis",
      "dadosNecessarios": [
        "Liste os principais dados necessários para preenchimento do escore (ex.: idade, sexo, PA sistólica, LDL, tabagismo, HbA1c, IMC, TFG, etc.)"
      ],
      "prioridade": "alta | media | baixa",
      "guidelineReferencia": "Cite, em 1 linha, a diretriz ou consenso que recomenda este escore (ex.: 'Diretriz X 202X', 'Consenso Y 202X')"
    }
  ]
}

REGRAS ADICIONAIS:
- Sugira, em geral, entre 3 e 7 escores (não precisa usar sempre o mesmo número).
- Se o quadro clínico for muito pobre ou pouco definido, você pode retornar uma lista pequena, com prioridade baixa.
- Se não houver dados minimamente suficientes para sugerir qualquer escore, retorne "escores": [].
`.trim();

        const schema = z.object({
          escores: z.array(
            z.object({
              id: z.string(),
              nome: z.string(),
              categoria: z.enum([
                "cardiovascular",
                "metabolico",
                "osseo",
                "renal",
                "hepatico",
                "endocrino-outros",
                "fragilidade",
                "psiquiatrico",
                "obesidade",
                "riscos-medicamentosos",
                "outros",
              ]),
              contextoClinico: z.string(),
              motivoRelevancia: z.string(),
              dadosNecessarios: z.array(z.string()),
              prioridade: z.enum(["alta", "media", "baixa"]),
              guidelineReferencia: z.string().optional(),
            })
          ),
        });

        const llmResponse = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "escores_sugestao",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  escores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        nome: { type: "string" },
                        categoria: {
                          type: "string",
                          enum: [
                            "cardiovascular",
                            "metabolico",
                            "osseo",
                            "renal",
                            "hepatico",
                            "endocrino-outros",
                            "fragilidade",
                            "psiquiatrico",
                            "obesidade",
                            "riscos-medicamentosos",
                            "outros",
                          ],
                        },
                        contextoClinico: { type: "string" },
                        motivoRelevancia: { type: "string" },
                        dadosNecessarios: {
                          type: "array",
                          items: { type: "string" },
                        },
                        prioridade: {
                          type: "string",
                          enum: ["alta", "media", "baixa"],
                        },
                        guidelineReferencia: { type: "string" },
                      },
                      required: [
                        "id",
                        "nome",
                        "categoria",
                        "contextoClinico",
                        "motivoRelevancia",
                        "dadosNecessarios",
                        "prioridade",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["escores"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = llmResponse.choices[0].message.content as string;
        const parsed = JSON.parse(content);
        const validated = schema.parse(parsed);

        return validated.escores;
      }),
  }),

  // ========== PRESCRIÇÕES ==========
  prescricoes: router({
    criar: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          consultaId: z.number().optional(),
          dataPrescricao: z.string(),
          itens: z
            .array(
              z.object({
                medicamentoId: z.number().optional(),
                medicamentoTextoLivre: z.string().optional(),
                dosagem: z.string().min(1),
                frequencia: z.string().min(1),
                duracao: z.string().min(1),
                orientacoes: z.string().optional(),
              })
            )
            .min(1),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const data = new Date(input.dataPrescricao);

        const prescricao = await db.criarPrescricaoComItens({
          pacienteId: input.pacienteId,
          consultaId: input.consultaId,
          dataPrescricao: data,
          observacoes: input.observacoes,
          itens: input.itens,
        });

        return prescricao;
      }),

    listar: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await db.listarPrescricoesPorPaciente(input.pacienteId);
      }),

    obter: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const completa = await db.obterPrescricaoCompleta(input.id);
        if (!completa) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prescrição não encontrada",
          });
        }
        return completa;
      }),

    sugerirPrescricao: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          diagnostico: z.string().min(3),
          comorbidades: z.array(z.string()).optional(),
        })
      )
      .query(async ({ input }) => {
        const { sugerirPrescricaoIA } = await import("./services/sugerirPrescricao");
        const sugestoes = await sugerirPrescricaoIA({
          diagnostico: input.diagnostico,
          comorbidades: input.comorbidades ?? [],
        });
        return sugestoes;
      }),

    verificarInteracoes: protectedProcedure
      .input(
        z.object({
          medicamentos: z.array(z.string()).min(2),
        })
      )
      .query(async ({ input }) => {
        const { verificarInteracoesIA } = await import("./services/verificarInteracoes");
        return await verificarInteracoesIA(input.medicamentos);
      }),
  }),

  // ========== MEDICAMENTOS ==========
  medicamentos: router({
    buscar: protectedProcedure
      .input(
        z.object({
          termo: z.string().min(1),
        })
      )
      .query(async ({ input }) => {
        return await db.buscarMedicamentosPorTermo(input.termo);
      }),

    listar: protectedProcedure.query(async () => {
      return await db.listarMedicamentosAtivos();
    }),
  }),
});

export type AppRouter = typeof appRouter;
