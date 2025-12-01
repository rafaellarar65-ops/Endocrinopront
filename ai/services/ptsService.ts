import { invokeLLM } from "../../_core/llm";

export interface PtsInput {
  pacienteNome: string;
  idade?: number;
  diagnosticos: string[];
  medicamentos: string[];
  examesRelevantes: string[];
  condutaClinica: string;
  metasAtuais: string[];
}

export interface PtsOutput {
  versaoMedico: string;
  versaoPaciente: string;
  sugestoesMEV: Array<{ titulo: string; descricao: string; impacto: "alto" | "medio" }>;
  metasSmartSugeridas: string[];
}

export class PtsService {
  static async gerarPlano(input: PtsInput): Promise<PtsOutput> {
    const prompt = `
Você é uma IA especialista em Medicina do Estilo de Vida e Endocrinologia.
Gere um Plano Terapêutico Singular (PTS) Dual com base nos dados abaixo:

PACIENTE: ${input.pacienteNome}, ${input.idade ? input.idade + " anos" : "idade não informada"}
DIAGNÓSTICOS: ${input.diagnosticos.join(", ")}
MEDICAMENTOS: ${input.medicamentos.join(", ")}
EXAMES CRÍTICOS: ${input.examesRelevantes.join("; ")}
CONDUTA MÉDICA: ${input.condutaClinica}
METAS ATUAIS: ${input.metasAtuais.join(", ")}

SAÍDA ESPERADA (JSON):
1. "versaoMedico": Texto técnico/científico justificando as escolhas, riscos calculados, alvos terapêuticos (HbA1c, LDL, etc) e guidelines utilizados.
2. "versaoPaciente": Texto acolhedor, sem jargões, focado em "o que fazer", "como fazer" e "por que fazer". Use emojis, listas e linguagem motivacional.
3. "sugestoesMEV": 3 a 5 intervenções de estilo de vida específicas para o caso (sono, dieta, exercício, estresse).
4. "metasSmartSugeridas": 3 metas SMART (Específica, Mensurável, Atingível, Relevante, Temporal) para os próximos 30 dias.
`;

    try {
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plano_terapeutico_dual",
            strict: true,
            schema: {
              type: "object",
              properties: {
                versaoMedico: { type: "string" },
                versaoPaciente: { type: "string" },
                sugestoesMEV: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string" },
                      descricao: { type: "string" },
                      impacto: { type: "string", enum: ["alto", "medio"] },
                    },
                    required: ["titulo", "descricao", "impacto"],
                    additionalProperties: false,
                  },
                },
                metasSmartSugeridas: { type: "array", items: { type: "string" } },
              },
              required: ["versaoMedico", "versaoPaciente", "sugestoesMEV", "metasSmartSugeridas"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = (response as any).choices?.[0]?.message?.content;
      if (!content) throw new Error("Falha ao gerar PTS: Resposta vazia");

      return JSON.parse(content) as PtsOutput;
    } catch (error) {
      console.error("Erro no PtsService:", error);
      throw new Error("Não foi possível gerar o Plano Terapêutico no momento.");
    }
  }
}
