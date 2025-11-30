import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

export interface SugestaoItemPrescricao {
  medicamento: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  orientacoes?: string;
}

export async function sugerirPrescricaoIA(params: {
  diagnostico: string;
  comorbidades?: string[];
  idade?: number;
  sexo?: "masculino" | "feminino" | "outro";
}): Promise<SugestaoItemPrescricao[]> {
  const { diagnostico, comorbidades = [], idade, sexo } = params;

  const prompt = `
Você é um endocrinologista experiente, trabalhando em um prontuário eletrônico.

Tarefa:
Sugira uma prescrição medicamentosa inicial PADRÃO para o seguinte contexto clínico:

Diagnóstico principal:
- ${diagnostico}

Comorbidades relevantes:
- ${comorbidades.length ? comorbidades.join("\n- ") : "Nenhuma informada"}

Dados adicionais:
- Idade: ${idade ?? "não informado"}
- Sexo: ${sexo ?? "não informado"}

Regras:
- Considere diretrizes atuais de endocrinologia e clínica médica.
- Priorize segurança: evite combinações com alto risco.
- Não prescreva fármacos controlados aqui (apenas deixe como sugestão genérica, se necessário).
- Retorne APENAS um JSON, sem comentários, no formato:

[
  {
    "medicamento": "Nome do medicamento",
    "dosagem": "dosagem ex: 500mg",
    "frequencia": "ex: 2x/dia",
    "duracao": "ex: 30 dias ou uso contínuo",
    "orientacoes": "texto curto opcional"
  }
]
`;

  try {
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
          name: "sugestoes_prescricao",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                medicamento: { type: "string" },
                dosagem: { type: "string" },
                frequencia: { type: "string" },
                duracao: { type: "string" },
                orientacoes: { type: "string" },
              },
              required: ["medicamento", "dosagem", "frequencia", "duracao"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("Nenhum conteúdo retornado pela IA");
    }

    const parsed = JSON.parse(content as string) as SugestaoItemPrescricao[];
    return parsed;
  } catch (error) {
    console.error("Erro ao sugerir prescrição via IA:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível gerar sugestão de prescrição no momento. Tente novamente.",
    });
  }
}
