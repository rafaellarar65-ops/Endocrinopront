import { invokeLLM } from "../_core/llm";

export interface DadosConsulta {
  queixaPrincipal?: string;
  historiaDoencaAtual?: string;
  antecedentesPessoais?: string;
  antecedentesFamiliares?: string;
  exameFisico?: any;
  hipotesesDiagnosticas?: string;
  conduta?: string;
  observacoes?: string;
}

export interface ResumoEvolutivoInput {
  resumoAnterior?: string | null;
  dadosNovaConsulta: DadosConsulta;
  pacienteNome: string;
  dataConsulta: string;
}

export interface ResumoEvolutivoOutput {
  resumoConsolidado: string;
  pontosChave: string[];
  evolucaoClinica: string;
}

/**
 * Serviço de IA para gerar resumo evolutivo consolidado
 * Combina o resumo anterior com os dados da nova consulta
 */
export class ResumoEvolutivoService {
  /**
   * Gera resumo evolutivo consolidado
   */
  static async gerarResumoConsolidado(
    input: ResumoEvolutivoInput,
    userId: number
  ): Promise<ResumoEvolutivoOutput> {
    const startTime = Date.now();

    try {
      const prompt = this.construirPrompt(input);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um assistente médico especializado em endocrinologia que gera resumos evolutivos consolidados de pacientes.

Seu objetivo é criar um resumo clínico evolutivo que:
1. Consolida o histórico anterior do paciente com os novos dados da consulta atual
2. Destaca a evolução clínica (melhoras, pioras, estabilidade)
3. Identifica pontos de atenção e mudanças significativas
4. Mantém informações relevantes do histórico
5. Remove informações obsoletas ou redundantes

O resumo deve ser:
- Objetivo e conciso (máximo 500 palavras)
- Organizado cronologicamente
- Focado em informações clinicamente relevantes
- Escrito em português brasileiro
- Formatado em markdown

Retorne um JSON com:
{
  "resumoConsolidado": "texto do resumo consolidado em markdown",
  "pontosChave": ["ponto 1", "ponto 2", ...],
  "evolucaoClinica": "descrição da evolução (melhora/piora/estável)"
}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resumo_evolutivo",
            strict: true,
            schema: {
              type: "object",
              properties: {
                resumoConsolidado: {
                  type: "string",
                  description: "Resumo consolidado em markdown",
                },
                pontosChave: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de pontos-chave da evolução",
                },
                evolucaoClinica: {
                  type: "string",
                  description: "Descrição da evolução clínica",
                },
              },
              required: ["resumoConsolidado", "pontosChave", "evolucaoClinica"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (!content || typeof content !== "string") {
        throw new Error("Resposta vazia ou inválida da IA");
      }

      const resultado: ResumoEvolutivoOutput = JSON.parse(content);

      // TODO: Adicionar log de auditoria

      return resultado;
    } catch (error) {
      // TODO: Adicionar log de erro
      console.error('[ResumoEvolutivoService] Erro:', error);

      throw error;
    }
  }

  /**
   * Constrói o prompt para a IA
   */
  private static construirPrompt(input: ResumoEvolutivoInput): string {
    const { resumoAnterior, dadosNovaConsulta, pacienteNome, dataConsulta } = input;

    let prompt = `# Paciente: ${pacienteNome}\n`;
    prompt += `# Data da Consulta Atual: ${dataConsulta}\n\n`;

    if (resumoAnterior) {
      prompt += `## RESUMO ANTERIOR DO PACIENTE:\n${resumoAnterior}\n\n`;
    } else {
      prompt += `## PRIMEIRA CONSULTA (sem histórico anterior)\n\n`;
    }

    prompt += `## DADOS DA CONSULTA ATUAL:\n\n`;

    if (dadosNovaConsulta.queixaPrincipal) {
      prompt += `**Queixa Principal:** ${dadosNovaConsulta.queixaPrincipal}\n\n`;
    }

    if (dadosNovaConsulta.historiaDoencaAtual) {
      prompt += `**História da Doença Atual:**\n${dadosNovaConsulta.historiaDoencaAtual}\n\n`;
    }

    if (dadosNovaConsulta.antecedentesPessoais) {
      prompt += `**Antecedentes Pessoais:**\n${dadosNovaConsulta.antecedentesPessoais}\n\n`;
    }

    if (dadosNovaConsulta.antecedentesFamiliares) {
      prompt += `**Antecedentes Familiares:**\n${dadosNovaConsulta.antecedentesFamiliares}\n\n`;
    }

    if (dadosNovaConsulta.exameFisico) {
      prompt += `**Exame Físico:**\n`;
      const ef = dadosNovaConsulta.exameFisico;
      if (ef.peso) prompt += `- Peso: ${ef.peso} kg\n`;
      if (ef.altura) prompt += `- Altura: ${ef.altura} cm\n`;
      if (ef.imc) prompt += `- IMC: ${ef.imc}\n`;
      if (ef.pressaoArterial) prompt += `- PA: ${ef.pressaoArterial}\n`;
      if (ef.exameGeral) prompt += `- Exame Geral: ${ef.exameGeral}\n`;
      if (ef.examePorSistemas) prompt += `- Exame por Sistemas: ${ef.examePorSistemas}\n`;
      prompt += `\n`;
    }

    if (dadosNovaConsulta.hipotesesDiagnosticas) {
      prompt += `**Hipóteses Diagnósticas:**\n${dadosNovaConsulta.hipotesesDiagnosticas}\n\n`;
    }

    if (dadosNovaConsulta.conduta) {
      prompt += `**Conduta:**\n${dadosNovaConsulta.conduta}\n\n`;
    }

    if (dadosNovaConsulta.observacoes) {
      prompt += `**Observações:**\n${dadosNovaConsulta.observacoes}\n\n`;
    }

    prompt += `\n---\n\n`;
    prompt += `Gere um resumo evolutivo consolidado que integre o histórico anterior (se houver) com os dados da consulta atual.`;

    return prompt;
  }
}
