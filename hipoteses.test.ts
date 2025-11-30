import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// Mock do invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock do db
vi.mock("./db", () => ({
  getConsultaById: vi.fn(),
  updateConsulta: vi.fn(),
}));

describe("Módulo 4: Hipóteses e Conduta", () => {
  const mockUser = {
    id: 1,
    name: "Dr. Teste",
    email: "teste@example.com",
    openId: "test-open-id",
    role: "admin" as const,
  };

  const mockCtx = {
    user: mockUser,
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockCtx);

  beforeAll(() => {
    // Setup inicial
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("deve atualizar hipóteses e conduta manualmente", async () => {
    // Arrange
    vi.mocked(db.updateConsulta).mockResolvedValue(undefined);

    // Act
    const result = await caller.consultas.updateHipotesesConduta({
      consultaId: 1,
      hipotesesDiagnosticas: "Diabetes tipo 2 descompensado",
      conduta: "Ajustar dose de metformina",
      observacoes: "Retorno em 30 dias",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(db.updateConsulta).toHaveBeenCalledWith(1, {
      hipotesesDiagnosticas: "Diabetes tipo 2 descompensado",
      conduta: "Ajustar dose de metformina",
      observacoes: "Retorno em 30 dias",
    });
  });

  it("deve gerar hipóteses e conduta com IA", async () => {
    // Arrange
    const mockConsulta = {
      id: 1,
      pacienteId: 1,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Poliúria e polidipsia",
        hda: "Paciente relata aumento da sede e micção há 2 meses",
      },
      exameFisico: {
        peso: "85",
        altura: "170",
        exameGeral: "Regular estado geral",
      },
      hipotesesDiagnosticas: null,
      conduta: null,
      observacoes: null,
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              hipotesesDiagnosticas:
                "1) Diabetes mellitus tipo 2 em investigação\n2) Possível diabetes insipidus a descartar",
              conduta:
                "- Solicitar glicemia de jejum, HbA1c, ureia, creatinina\n- Orientar dieta hipoglicídica\n- Retorno em 7 dias com exames",
              observacoes:
                "Paciente orientado sobre sinais de hiperglicemia grave. Procurar PS se apresentar náuseas, vômitos ou alteração de consciência.",
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
    vi.mocked(db.updateConsulta).mockResolvedValue(undefined);

    // Act
    const result = await caller.consultas.atualizarHipotesesCondutaIA({
      consultaId: 1,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.hipotesesDiagnosticas).toContain("Diabetes mellitus");
    expect(result.conduta).toContain("glicemia de jejum");
    expect(result.observacoes).toContain("hiperglicemia");
    expect(db.updateConsulta).toHaveBeenCalledWith(1, {
      hipotesesDiagnosticas: expect.stringContaining("Diabetes mellitus"),
      conduta: expect.stringContaining("glicemia de jejum"),
      observacoes: expect.stringContaining("hiperglicemia"),
    });
  });

  it("deve permitir atualização parcial de campos", async () => {
    // Arrange
    vi.mocked(db.updateConsulta).mockResolvedValue(undefined);

    // Act
    const result = await caller.consultas.updateHipotesesConduta({
      consultaId: 1,
      hipotesesDiagnosticas: "Hipotireoidismo primário",
      conduta: null,
      observacoes: null,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(db.updateConsulta).toHaveBeenCalledWith(1, {
      hipotesesDiagnosticas: "Hipotireoidismo primário",
      conduta: null,
      observacoes: null,
    });
  });

  it("deve usar dados do resumo quando disponível para gerar hipóteses com IA", async () => {
    // Arrange
    const mockConsulta = {
      id: 2,
      pacienteId: 2,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Ganho de peso",
      },
      exameFisico: {
        peso: "95",
      },
      resumo: JSON.stringify({
        principaisQueixas: "Ganho de peso progressivo",
        achadosRelevantes: ["IMC 32", "Circunferência abdominal aumentada"],
        hipotesesDiagnosticas: ["Obesidade grau I", "Síndrome metabólica"],
        condutasPropostas: [
          "Avaliação nutricional",
          "Exames metabólicos",
        ],
      }),
      hipotesesDiagnosticas: null,
      conduta: null,
      observacoes: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              hipotesesDiagnosticas:
                "1) Obesidade grau I com síndrome metabólica provável\n2) Investigar hipotireoidismo secundário",
              conduta:
                "- Encaminhar para nutricionista\n- Solicitar perfil lipídico, glicemia, TSH, T4 livre\n- Iniciar atividade física supervisionada",
              observacoes:
                "Meta de perda de peso: 5-10% em 6 meses. Retorno mensal para acompanhamento.",
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);
    vi.mocked(db.updateConsulta).mockResolvedValue(undefined);

    // Act
    const result = await caller.consultas.atualizarHipotesesCondutaIA({
      consultaId: 2,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.hipotesesDiagnosticas).toContain("Obesidade");
    expect(result.conduta).toContain("nutricionista");
    expect(result.observacoes).toContain("perda de peso");
  });
});
