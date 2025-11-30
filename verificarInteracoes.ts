import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

export interface InteracaoMedicamento {
  medicamento1: string;
  medicamento2: string;
  gravidade: "leve" | "moderada" | "grave";
  descricao: string;
  recomendacao?: string;
}

export async function verificarInteracoesIA(
  medicamentos: string[]
): Promise<InteracaoMedicamento[]> {
  const lista = medicamentos.join(", ");

  const prompt = `
Você é um sistema de apoio à decisão clínica.

Tarefa:
Avalie possíveis interações medicamentosas CLINICAMENTE RELEVANTES entre os seguintes medicamentos:

${lista}

Regras:
- Considere diretrizes atuais e fontes reconhecidas de interações medicamentosas.
- Liste somente interações relevantes do ponto de vista clínico.
- Para cada interação, informe:
  - medicamento1
  - medicamento2
  - gravidade: "leve", "moderada" ou "grave"
  - descricao: explicação curta
  - recomendacao: conduta sugerida (opcional)

Retorne APENAS um JSON no formato:

[
  {
    "medicamento1": "nome",
    "medicamento2": "nome",
    "gravidade": "leve|moderada|grave",
    "descricao": "texto",
    "recomendacao": "texto opcional"
  }
]
`;

  try {
    if (medicamentos.length < 2) return [];

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interacoes_medicamentosas",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                medicamento1: { type: "string" },
                medicamento2: { type: "string" },
                gravidade: {
                  type: "string",
                  enum: ["leve", "moderada", "grave"],
                },
                descricao: { type: "string" },
                recomendacao: { type: "string" },
              },
              required: ["medicamento1", "medicamento2", "gravidade", "descricao"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return [];

    return JSON.parse(content as string) as InteracaoMedicamento[];
  } catch (error) {
    console.error("Erro ao verificar interações via IA:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível verificar interações medicamentosas no momento.",
    });
  }
}
