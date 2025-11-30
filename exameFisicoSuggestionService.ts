import { invokeLLM } from "../../_core/llm";

export interface ExameFisicoSugestao {
  categoria: "dados_vitais" | "exame_geral" | "exame_especifico";
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  fundamentacao: string;
  pontosAtencao: string[];
}

export interface AnamneseData {
  queixaPrincipal?: string;
  hda?: string;
  historicoPatologico?: string;
  medicamentosEmUso?: string;
  alergias?: string;
  historicoFamiliar?: string;
  habitosVida?: string;
}

export async function generateExameFisicoSuggestions(
  anamnese: AnamneseData
): Promise<ExameFisicoSugestao[]> {
  const startTime = Date.now();

  try {
    const prompt = buildSuggestionPrompt(anamnese);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um médico endocrinologista experiente, atuando em consultório de alta resolução.

Sua função é:
1) Ler a anamnese estruturada (queixa principal, HDA, comorbidades, uso de medicações, antecedentes, hábitos).
2) Identificar, a partir desse contexto, quais **achados do exame físico** são mais críticos para:
   - Obesidade e síndrome metabólica
   - Diabetes tipo 1, tipo 2, LADA e pré-diabetes
   - Doenças tireoidianas (hipo/hiper, nódulos, bócio, orbitopatia)
   - Síndrome de Cushing, insuficiência adrenal, hiperaldosteronismo
   - Hipogonadismo, SOP, disfunções gonadais em geral
   - Uso de esteroides anabolizantes e outras drogas que alterem composição corporal
   - Uso de análogos de GLP-1 / GIP (semaglutida, tirzepatida, retatrutida etc.)

REGRAS:
- Seja **específico e prático**: o objetivo é o médico bater o olho e saber onde focar o exame.
- Priorize o que muda conduta endocrinológica ou risco cardiovascular.
- Justifique cada sugestão com base em elementos da anamnese (ligar causa ↔ efeito).
- Máximo de **5 sugestões** por consulta.
- Ordene por **prioridade** (alta → média → baixa).
- Não repita sugestões muito parecidas; agrupe raciocínios quando fizer sentido.
- Não descreva diagnósticos; descreva **o que examinar** e **como examinar**.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exame_fisico_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sugestoes: {
                type: "array",
                description: "Lista de sugestões para o exame físico",
                items: {
                  type: "object",
                  properties: {
                    categoria: {
                      type: "string",
                      enum: ["dados_vitais", "exame_geral", "exame_especifico"],
                    },
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    prioridade: {
                      type: "string",
                      enum: ["alta", "media", "baixa"],
                    },
                    fundamentacao: { type: "string" },
                    pontosAtencao: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "categoria",
                    "titulo",
                    "descricao",
                    "prioridade",
                    "fundamentacao",
                    "pontosAtencao",
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const contentText = typeof content === "string" ? content : "";
    const result = JSON.parse(contentText);

    console.log(
      `[ExameFisicoSuggestionService] ${result.sugestoes.length} sugestões geradas em ${Date.now() - startTime}ms`
    );

    return result.sugestoes;
  } catch (error) {
    console.error("[ExameFisicoSuggestionService] Erro:", error);
    throw new Error(
      `Falha ao gerar sugestões: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

function buildSuggestionPrompt(anamnese: AnamneseData): string {
  const sections: string[] = [];

  sections.push(
    "Contexto: você irá sugerir avaliações dirigidas para o exame físico em uma consulta de endocrinologia."
  );
  sections.push(
    "Use a anamnese abaixo para decidir onde o exame físico deve ser mais aprofundado."
  );
  sections.push("");

  if (anamnese.queixaPrincipal) {
    sections.push(`Queixa Principal: ${anamnese.queixaPrincipal}`);
  }

  if (anamnese.hda) {
    sections.push(`História da Doença Atual (HDA): ${anamnese.hda}`);
  }

  if (anamnese.historicoPatologico) {
    sections.push(
      `Histórico Patológico (diabetes, tireoide, obesidade, outras): ${anamnese.historicoPatologico}`
    );
  }

  if (anamnese.medicamentosEmUso) {
    sections.push(
      `Medicamentos em Uso (insulinas, GLP-1, esteroides, tireoidianos etc.): ${anamnese.medicamentosEmUso}`
    );
  }

  if (anamnese.alergias) {
    sections.push(`Alergias: ${anamnese.alergias}`);
  }

  if (anamnese.historicoFamiliar) {
    sections.push(
      `Histórico Familiar (DM, tireoide, cardiopatias, dislipidemia, obesidade): ${anamnese.historicoFamiliar}`
    );
  }

  if (anamnese.habitosVida) {
    sections.push(
      `Hábitos de Vida (tabagismo, álcool, dieta, exercício, sono): ${anamnese.habitosVida}`
    );
  }

  sections.push("");
  sections.push(
    "Com base nisso, devolva de 1 a 5 sugestões de exame físico endocrinológico estruturadas em JSON, seguindo o schema fornecido."
  );
  sections.push(
    "Mantenha o foco em: composição corporal, distribuição de gordura, estigmas de insulinorresistência, estigmas de hipo/hipertireoidismo, sinais de hipercortisolismo, hipogonadismo, estigmas de uso de AAS/esteroides, complicações crônicas do DM."
  );

  return sections.join("\n");
}
