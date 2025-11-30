import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { aiAuditLogs } from "./schema";

export interface ExameLabData {
  tipoExame: string;
  dataColeta: string;
  laboratorio?: string;
  valores: Array<{
    parametro: string;
    valor: string;
    unidade: string;
    valorReferencia: string;
    status: "normal" | "alterado" | "critico";
  }>;
}

export const ExamesLabService = {
  name: "ExamesLaboratoriais",
  version: "1.0.0",

  async process(input: { imageUrl: string; userId: number; patientId: number }): Promise<{ success: boolean; data?: ExameLabData; error?: string; metadata?: any }> {
    const startTime = Date.now();

    try {
      const systemPrompt = `Você é um assistente especializado em extrair dados de exames laboratoriais.

INSTRUÇÕES:
1. Analise a imagem do exame laboratorial fornecida
2. Extraia TODOS os valores de exames presentes
3. Identifique o tipo de exame (hemograma, glicemia, perfil lipídico, função renal, etc.)
4. Para cada parâmetro, extraia: nome, valor, unidade e valor de referência
5. Classifique cada valor como "normal", "alterado" ou "critico"
6. Retorne os dados estruturados em JSON

DIRETRIZES CLÍNICAS:
- Valores críticos: glicemia >400 ou <50, creatinina >3.0, potássio >6.0 ou <2.5
- Valores alterados: fora da faixa de referência mas não críticos
- Valores normais: dentro da faixa de referência

FORMATO DE SAÍDA (JSON):
{
  "tipoExame": "tipo do exame",
  "dataColeta": "data no formato YYYY-MM-DD",
  "laboratorio": "nome do laboratório (se disponível)",
  "valores": [
    {
      "parametro": "nome do parâmetro",
      "valor": "valor numérico",
      "unidade": "unidade de medida",
      "valorReferencia": "faixa de referência",
      "status": "normal|alterado|critico"
    }
  ]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este exame laboratorial e extraia todos os dados:",
              },
              {
                type: "image_url",
                image_url: {
                  url: input.imageUrl,
                  detail: "high",
                },
              },
            ] as any,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "exame_laboratorial",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tipoExame: { type: "string" },
                dataColeta: { type: "string" },
                laboratorio: { type: "string" },
                valores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      parametro: { type: "string" },
                      valor: { type: "string" },
                      unidade: { type: "string" },
                      valorReferencia: { type: "string" },
                      status: { type: "string", enum: ["normal", "alterado", "critico"] },
                    },
                    required: ["parametro", "valor", "unidade", "valorReferencia", "status"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["tipoExame", "dataColeta", "valores"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error("Resposta vazia ou inválida da IA");
      }

      const exameData: ExameLabData = JSON.parse(content);
      const processingTime = Date.now() - startTime;

      // Log de auditoria
      const db = await getDb();
      if (db) {
        try {
          await db.insert(aiAuditLogs).values({
            userId: input.userId,
            patientId: input.patientId,
            serviceType: "exames_laboratoriais",
            model: "gemini-2.0-flash-exp",
            provider: "google",
            success: true,
            duration: processingTime,
            tokensUsed: response.usage?.total_tokens || 0,
            metadata: { imageUrl: input.imageUrl.substring(0, 100) + "...", exameData },
            createdAt: new Date(),
          });
        } catch (e) {
          console.error('[AI Audit] Erro ao salvar log:', e);
        }
      }

      return {
        success: true,
        data: exameData,
        metadata: {
          processingTime,
          tokensUsed: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      // Log de auditoria de erro
      const db = await getDb();
      if (db) {
        try {
          await db.insert(aiAuditLogs).values({
            userId: input.userId,
            patientId: input.patientId,
            serviceType: "exames_laboratoriais",
            model: "gemini-2.0-flash-exp",
            provider: "google",
            success: false,
            duration: processingTime,
            errorMessage,
            metadata: { imageUrl: input.imageUrl },
            createdAt: new Date(),
          });
        } catch (e) {
          console.error('[AI Audit] Erro ao salvar log:', e);
        }
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          processingTime,
        },
      };
    }
  },
};
