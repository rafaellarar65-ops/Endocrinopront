import { invokeLLM } from "../../_core/llm";

/**
 * Interface para o resumo estruturado da consulta
 */
export interface ConsultaSummary {
  principaisQueixas: string[];
  achadosRelevantes: string[];
  hipotesesDiagnosticas: string[];
  condutasPropostas: string[];
  observacoesImportantes: string;
  resumoNarrativo: string;
}

/**
 * Interface para os dados de entrada da consulta
 */
export interface ConsultaData {
  anamnese?: {
    queixaPrincipal?: string;
    hda?: string;
    historicoPatologico?: string;
    medicamentosEmUso?: string;
    alergias?: string;
    historicoFamiliar?: string;
    habitosVida?: string;
  };
  exameFisico?: {
    peso?: string;
    altura?: string;
    imc?: string;
    pressaoArterial?: string;
    frequenciaCardiaca?: string;
    temperatura?: string;
    exameGeral?: string;
    exameEspecifico?: string;
  };
  hipotesesDiagnosticas?: string;
  conduta?: string;
  observacoes?: string;
}

/**
 * Gera um resumo estruturado da consulta usando IA
 */
export async function generateConsultaSummary(
  consultaData: ConsultaData
): Promise<ConsultaSummary> {
  const startTime = Date.now();

  try {
    // Construir o prompt com os dados da consulta
    const prompt = buildSummaryPrompt(consultaData);

    // Chamar a IA com response_format estruturado
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente médico especializado em endocrinologia. Sua função é gerar resumos estruturados de consultas médicas de forma clara, objetiva e profissional.

IMPORTANTE:
- Seja conciso e objetivo
- Use terminologia médica apropriada
- Destaque informações clinicamente relevantes
- Organize as informações de forma lógica
- Não invente informações que não estão nos dados fornecidos
- Se algum campo estiver vazio, indique como "Não informado" ou deixe a lista vazia`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "consulta_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              principaisQueixas: {
                type: "array",
                description: "Lista das principais queixas do paciente (máximo 5 itens)",
                items: { type: "string" },
              },
              achadosRelevantes: {
                type: "array",
                description: "Achados relevantes do exame físico e anamnese (máximo 5 itens)",
                items: { type: "string" },
              },
              hipotesesDiagnosticas: {
                type: "array",
                description: "Principais hipóteses diagnósticas (máximo 5 itens)",
                items: { type: "string" },
              },
              condutasPropostas: {
                type: "array",
                description: "Condutas e orientações propostas (máximo 5 itens)",
                items: { type: "string" },
              },
              observacoesImportantes: {
                type: "string",
                description: "Observações importantes sobre a consulta (máximo 500 caracteres)",
              },
              resumoNarrativo: {
                type: "string",
                description: "Resumo narrativo completo da consulta em formato de parágrafo (máximo 1000 caracteres)",
              },
            },
            required: [
              "principaisQueixas",
              "achadosRelevantes",
              "hipotesesDiagnosticas",
              "condutasPropostas",
              "observacoesImportantes",
              "resumoNarrativo",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const duration = Date.now() - startTime;

    // Parsear a resposta JSON
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    const contentText = typeof content === 'string' ? content : '';
    const summary: ConsultaSummary = JSON.parse(contentText);

    // Log de sucesso
    console.log(`[ConsultaSummaryService] Resumo gerado com sucesso em ${duration}ms`);

    return summary;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ConsultaSummaryService] Erro ao gerar resumo:`, error);

    // Log de erro (pode ser implementado posteriormente se necessário)

    throw new Error(
      `Falha ao gerar resumo da consulta: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

/**
 * Constrói o prompt para geração do resumo
 */
function buildSummaryPrompt(consultaData: ConsultaData): string {
  const sections: string[] = [];

  // Anamnese
  if (consultaData.anamnese) {
    sections.push("=== ANAMNESE ===");

    if (consultaData.anamnese.queixaPrincipal) {
      sections.push(`Queixa Principal: ${consultaData.anamnese.queixaPrincipal}`);
    }

    if (consultaData.anamnese.hda) {
      sections.push(`História da Doença Atual: ${consultaData.anamnese.hda}`);
    }

    if (consultaData.anamnese.historicoPatologico) {
      sections.push(`Histórico Patológico: ${consultaData.anamnese.historicoPatologico}`);
    }

    if (consultaData.anamnese.medicamentosEmUso) {
      sections.push(`Medicamentos em Uso: ${consultaData.anamnese.medicamentosEmUso}`);
    }

    if (consultaData.anamnese.alergias) {
      sections.push(`Alergias: ${consultaData.anamnese.alergias}`);
    }

    if (consultaData.anamnese.historicoFamiliar) {
      sections.push(`Histórico Familiar: ${consultaData.anamnese.historicoFamiliar}`);
    }

    if (consultaData.anamnese.habitosVida) {
      sections.push(`Hábitos de Vida: ${consultaData.anamnese.habitosVida}`);
    }

    sections.push("");
  }

  // Exame Físico
  if (consultaData.exameFisico) {
    sections.push("=== EXAME FÍSICO ===");

    const dadosVitais: string[] = [];
    if (consultaData.exameFisico.peso) dadosVitais.push(`Peso: ${consultaData.exameFisico.peso}kg`);
    if (consultaData.exameFisico.altura) dadosVitais.push(`Altura: ${consultaData.exameFisico.altura}cm`);
    if (consultaData.exameFisico.imc) dadosVitais.push(`IMC: ${consultaData.exameFisico.imc}`);
    if (consultaData.exameFisico.pressaoArterial) dadosVitais.push(`PA: ${consultaData.exameFisico.pressaoArterial}mmHg`);
    if (consultaData.exameFisico.frequenciaCardiaca) dadosVitais.push(`FC: ${consultaData.exameFisico.frequenciaCardiaca}bpm`);
    if (consultaData.exameFisico.temperatura) dadosVitais.push(`Temp: ${consultaData.exameFisico.temperatura}°C`);

    if (dadosVitais.length > 0) {
      sections.push(`Dados Vitais: ${dadosVitais.join(", ")}`);
    }

    if (consultaData.exameFisico.exameGeral) {
      sections.push(`Exame Geral: ${consultaData.exameFisico.exameGeral}`);
    }

    if (consultaData.exameFisico.exameEspecifico) {
      sections.push(`Exame Específico: ${consultaData.exameFisico.exameEspecifico}`);
    }

    sections.push("");
  }

  // Hipóteses Diagnósticas
  if (consultaData.hipotesesDiagnosticas) {
    sections.push("=== HIPÓTESES DIAGNÓSTICAS ===");
    sections.push(consultaData.hipotesesDiagnosticas);
    sections.push("");
  }

  // Conduta
  if (consultaData.conduta) {
    sections.push("=== CONDUTA ===");
    sections.push(consultaData.conduta);
    sections.push("");
  }

  // Observações
  if (consultaData.observacoes) {
    sections.push("=== OBSERVAÇÕES ===");
    sections.push(consultaData.observacoes);
    sections.push("");
  }

  const prompt = `Analise os dados da consulta médica abaixo e gere um resumo estruturado:

${sections.join("\n")}

Gere um resumo estruturado seguindo o formato JSON especificado.`;

  return prompt;
}
