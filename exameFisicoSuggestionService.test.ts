import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateExameFisicoSuggestions,
  type AnamneseData,
  type ExameFisicoSugestao,
} from "./exameFisicoSuggestionService";

// Mock do invokeLLM
vi.mock("../../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "../../_core/llm";

describe("ExameFisicoSuggestionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar sugestões de exame físico a partir de anamnese completa", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              sugestoes: [
                {
                  categoria: "dados_vitais",
                  titulo: "Avaliar IMC e circunferência abdominal",
                  descricao: "Paciente relata ganho de peso recente",
                  prioridade: "alta",
                  fundamentacao: "Ganho de peso pode indicar síndrome metabólica",
                  pontosAtencao: ["Medir peso e altura", "Calcular IMC"],
                },
                {
                  categoria: "exame_especifico",
                  titulo: "Exame de tireoide",
                  descricao: "Avaliar tamanho, consistência e presença de nódulos",
                  prioridade: "media",
                  fundamentacao: "Histórico familiar de doença tireoidiana",
                  pontosAtencao: ["Palpação de tireoide", "Verificar presença de bócio"],
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

    const anamnese: AnamneseData = {
      queixaPrincipal: "Ganho de peso",
      hda: "Paciente relata ganho de 10kg nos últimos 6 meses",
      historicoFamiliar: "Mãe com hipotireoidismo",
      habitosVida: "Sedentário, dieta rica em carboidratos",
    };

    const sugestoes = await generateExameFisicoSuggestions(anamnese);

    expect(sugestoes).toHaveLength(2);
    expect(sugestoes[0].categoria).toBe("dados_vitais");
    expect(sugestoes[0].prioridade).toBe("alta");
    expect(sugestoes[1].categoria).toBe("exame_especifico");
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("deve gerar sugestões mesmo com anamnese mínima", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              sugestoes: [
                {
                  categoria: "exame_geral",
                  titulo: "Avaliação geral do estado nutricional",
                  descricao: "Verificar estado geral do paciente",
                  prioridade: "media",
                  fundamentacao: "Avaliação básica necessária",
                  pontosAtencao: ["Estado geral", "Hidratação"],
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

    const anamnese: AnamneseData = {
      queixaPrincipal: "Consulta de rotina",
    };

    const sugestoes = await generateExameFisicoSuggestions(anamnese);

    expect(sugestoes).toHaveLength(1);
    expect(sugestoes[0].categoria).toBe("exame_geral");
  });

  it("deve lançar erro quando IA retorna resposta vazia", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

    const anamnese: AnamneseData = {
      queixaPrincipal: "Teste",
    };

    await expect(generateExameFisicoSuggestions(anamnese)).rejects.toThrow(
      "Resposta vazia da IA"
    );
  });

  it("deve incluir todos os campos da anamnese no prompt", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              sugestoes: [],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

    const anamnese: AnamneseData = {
      queixaPrincipal: "Diabetes",
      hda: "Poliúria e polidipsia há 2 meses",
      historicoPatologico: "HAS",
      medicamentosEmUso: "Losartana 50mg",
      alergias: "Nenhuma",
      historicoFamiliar: "Pai com DM2",
      habitosVida: "Tabagista",
    };

    await generateExameFisicoSuggestions(anamnese);

    const callArgs = vi.mocked(invokeLLM).mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === "user");

    expect(userMessage.content).toContain("Diabetes");
    expect(userMessage.content).toContain("Poliúria");
    expect(userMessage.content).toContain("HAS");
    expect(userMessage.content).toContain("Losartana");
    expect(userMessage.content).toContain("Pai com DM2");
    expect(userMessage.content).toContain("Tabagista");
  });

  it("deve usar response_format com JSON schema estruturado", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              sugestoes: [],
            }),
          },
        },
      ],
    };

    vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

    const anamnese: AnamneseData = {
      queixaPrincipal: "Teste",
    };

    await generateExameFisicoSuggestions(anamnese);

    const callArgs = vi.mocked(invokeLLM).mock.calls[0][0];

    expect(callArgs.response_format).toBeDefined();
    expect(callArgs.response_format.type).toBe("json_schema");
    expect(callArgs.response_format.json_schema.name).toBe("exame_fisico_suggestions");
    expect(callArgs.response_format.json_schema.strict).toBe(true);
  });
});
