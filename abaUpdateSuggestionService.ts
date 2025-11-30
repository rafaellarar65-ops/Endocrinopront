import { invokeLLM } from "../../_core/llm";

export type TipoAba = "hma" | "exame_fisico" | "resumo" | "hipoteses" | "plano";

export interface HipoteseSugerida {
  diagnostico: string;
  cid10: string;
  probabilidade: "alta" | "media" | "baixa";
  fundamentacao: string;
}

export interface ExameSugerido {
  nome: string;
  justificativa: string;
  urgencia: "urgente" | "preferencial" | "rotina" | "rotina/ambulatorial";
}

export interface AbaSugestao {
  campo: string;
  tipoSugestao: "complementar" | "calcular" | "atualizar" | "adicionar" | "corrigir";
  sugestao: string;
  fundamentacao: string;
  textoSugerido?: string;
  valorCalculado?: string | number | null;
  prioridade: "alta" | "media" | "baixa";
  hipoteseSugerida?: HipoteseSugerida;
  exameSugerido?: ExameSugerido;
}

export interface ConsultaContexto {
  anamnese?: any;
  exameFisico?: any;
  resumo?: any;
  hipotesesDiagnosticas?: string;
  conduta?: string;
}

export async function generateAbaSuggestions(
  abaAtual: TipoAba,
  contexto: ConsultaContexto
): Promise<AbaSugestao[]> {
  const startTime = Date.now();

  try {
    const prompt = buildAbaPrompt(abaAtual, contexto);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: getSystemPromptForAba(abaAtual),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "aba_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sugestoes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    campo: { type: "string" },
                    tipoSugestao: {
                      type: "string",
                      enum: ["complementar", "calcular", "atualizar", "adicionar", "corrigir"],
                    },
                    sugestao: { type: "string" },
                    fundamentacao: { type: "string" },
                    textoSugerido: { type: "string" },
                    prioridade: {
                      type: "string",
                      enum: ["alta", "media", "baixa"],
                    },
                  },
                  required: ["campo", "tipoSugestao", "sugestao", "fundamentacao", "prioridade"],
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const result = typeof content === "string" ? JSON.parse(content) : content;

    console.log(
      `[AbaUpdateSuggestionService] ${result.sugestoes.length} sugestões geradas para ${abaAtual} em ${
        Date.now() - startTime
      }ms`
    );

    return result.sugestoes as AbaSugestao[];
  } catch (error) {
    console.error("[AbaUpdateSuggestionService] Erro:", error);
    throw new Error(
      `Falha ao gerar sugestões: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`
    );
  }
}

function getSystemPromptForAba(aba: TipoAba): string {
  const prompts: Record<TipoAba, string> = {
    hma: `
Você é um médico endocrinologista experiente, atuando em consultório.

TAREFA:
- Analise a anamnese (HMA) e o restante do contexto da consulta.
- Identifique informações ESSENCIAIS que estão faltando ou pouco detalhadas.
- Foque em: queixa principal, tempo de evolução, fatores desencadeantes e de alívio,
  sintomas associados relevantes para endocrinologia e impacto no dia a dia.

REGRAS:
- Não invente dados. Se algo não existir, sugira que o médico complemente.
- Seja específico na sugestão.
- Quando fornecer texto sugerido, escreva em linguagem de prontuário, objetiva, na terceira pessoa.

Responda SEMPRE no formato JSON definido no schema.`,

    exame_fisico: `
Você é um médico endocrinologista experiente.

TAREFA:
- Analise exame físico, sinais vitais e dados antropométricos.
- Cruze com a anamnese e identifique:
  - Medidas importantes faltantes (PA, FC, FR, peso, altura, circunferências).
  - Cálculos automáticos possíveis (IMC, superfície corporal, relação cintura-quadril).
  - Achados relevantes que seria importante examinar dado o contexto (ex.: tireoide, acantose nigricans, lipodistrofia, exame de pés em diabéticos).

REGRAS:
- Use tipoSugestao="calcular" quando puder derivar algo de dados já preenchidos.
- Não crie achados físicos que contradigam o que já foi descrito.
- Se algo não foi examinado, sugira que seja examinado, não invente o resultado.

Responda SEMPRE no formato JSON definido no schema.`,

    resumo: `
Você é um médico endocrinologista experiente.

TAREFA:
- Analise o resumo da consulta e compare com HMA + exame físico.
- Verifique se o resumo:
  - Está coerente com os dados detalhados.
  - Está atualizado com as últimas alterações.
  - Está organizado (queixa principal → contexto → achados-chave → hipóteses).

REGRAS:
- Não crie novas hipóteses aqui, apenas organize o que já existe.
- Use tipoSugestao="atualizar" quando sugerir um novo texto de resumo completo.
- Utilize linguagem de prontuário, objetiva.

Responda SEMPRE no formato JSON definido no schema.`,

    hipoteses: `
Você é um médico endocrinologista experiente.

TAREFA:
- A partir de HMA + exame físico, sugira hipóteses diagnósticas.
- Para cada hipótese, inclua:
  - Diagnóstico em linguagem médica.
  - CID-10.
  - Probabilidade (alta, média, baixa).
  - Breve fundamentação com sintomas e achados.

REGRAS:
- Ordene as hipóteses da mais provável para a menos provável.
- Não invente exames laboratoriais inexistentes no contexto.
- Considere diagnósticos diferenciais relevantes em endocrinologia.

Responda SEMPRE no formato JSON definido no schema.`,

    plano: `
Você é um médico endocrinologista experiente.

TAREFA:
- Com base nas hipóteses e demais dados da consulta:
  - Sugira exames complementares adequados.
  - Sugira ajustes terapêuticos possíveis.
  - Sugira orientações de estilo de vida coerentes com o quadro.

REGRAS:
- Baseie-se em condutas conservadoras e alinhadas a diretrizes.
- Se faltar informação para uma decisão, aponte o que deve ser avaliado antes.
- Estruture suas sugestões por categoria (exames, medicações, orientações) no texto sugerido, se aplicável.

Responda SEMPRE no formato JSON definido no schema.`,
  };

  return prompts[aba];
}

function buildAbaPrompt(aba: TipoAba, contexto: ConsultaContexto): string {
  const sections: string[] = [];

  sections.push(
    `Analise o contexto completo da consulta e sugira melhorias APENAS para a aba: ${aba.toUpperCase()}.`
  );
  sections.push(
    `Não invente dados que contradigam o contexto. Se faltar informação, sugira que o médico complemente.`
  );
  sections.push("");

  if (contexto.anamnese) {
    sections.push("=== ANAMNESE (HMA) ===");
    sections.push(JSON.stringify(contexto.anamnese, null, 2));
    sections.push("");
  }

  if (contexto.exameFisico) {
    sections.push("=== EXAME FÍSICO ===");
    sections.push(JSON.stringify(contexto.exameFisico, null, 2));
    sections.push("");
  }

  if (contexto.resumo) {
    sections.push("=== RESUMO ===");
    sections.push(JSON.stringify(contexto.resumo, null, 2));
    sections.push("");
  }

  if (contexto.hipotesesDiagnosticas) {
    sections.push("=== HIPÓTESES DIAGNÓSTICAS ===");
    sections.push(contexto.hipotesesDiagnosticas);
    sections.push("");
  }

  if (contexto.conduta) {
    sections.push("=== PLANO TERAPÊUTICO ===");
    sections.push(contexto.conduta);
    sections.push("");
  }

  sections.push("Gere sugestões práticas, específicas e prioritizadas para melhorar a aba atual.");

  return sections.join("\n");
}
