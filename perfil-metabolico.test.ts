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
  getExamesByPaciente: vi.fn(),
}));

describe("Módulo 5: Perfil Metabólico", () => {
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

  it("deve retornar último exame com dados brutos parseados", async () => {
    // Arrange
    const mockExames = [
      {
        id: 1,
        pacienteId: 1,
        medicoId: 1,
        dataExame: new Date("2024-01-15"),
        tipoExame: "Perfil Metabólico",
        resultados: JSON.stringify({
          glicemia: 120,
          hba1c: 6.5,
          colesterolTotal: 200,
          ldl: 130,
          hdl: 45,
          triglicerideos: 150,
          insulina: 15,
          tsh: 2.5,
          t4Livre: 1.2,
        }),
        arquivoUrl: null,
        arquivoPath: null,
        observacoes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getExamesByPaciente).mockResolvedValue(mockExames);

    // Act
    const result = await caller.consultas.getUltimosExames({
      pacienteId: 1,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result?.glicemia).toBe(120);
    expect(result?.hba1c).toBe(6.5);
    expect(result?.colesterolTotal).toBe(200);
    expect(result?.ldl).toBe(130);
    expect(result?.hdl).toBe(45);
    expect(result?.triglicerideos).toBe(150);
    expect(result?.tsh).toBe(2.5);
  });

  it("deve retornar null quando não há exames", async () => {
    // Arrange
    vi.mocked(db.getExamesByPaciente).mockResolvedValue([]);

    // Act
    const result = await caller.consultas.getUltimosExames({
      pacienteId: 2,
    });

    // Assert
    expect(result).toBeNull();
  });

  it("deve sugerir índices metabólicos relevantes baseado no quadro clínico", async () => {
    // Arrange
    const mockConsulta = {
      id: 1,
      pacienteId: 1,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Ganho de peso e cansaço",
        hda: "Paciente relata ganho de 10kg em 6 meses",
      },
      exameFisico: {
        peso: "95",
        altura: "165",
        exameGeral: "Obesidade grau I",
      },
      hipotesesDiagnosticas: "Síndrome metabólica",
      conduta: null,
      observacoes: null,
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExames = [
      {
        id: 1,
        pacienteId: 1,
        medicoId: 1,
        dataExame: new Date(),
        tipoExame: "Perfil Metabólico",
        resultados: JSON.stringify({
          glicemia: 110,
          insulina: 18,
          triglicerideos: 180,
          hdl: 38,
        }),
        arquivoUrl: null,
        arquivoPath: null,
        observacoes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              indices: [
                {
                  id: "homa-ir-1",
                  nome: "HOMA-IR (Índice de Resistência Insulínica)",
                  categoria: "resistencia-insulinica",
                  valorCalculado: 4.9,
                  unidade: null,
                  interpretacao:
                    "Valor elevado (>2.5) indica resistência insulínica significativa",
                  motivoRelevancia:
                    "Paciente com obesidade e síndrome metabólica provável",
                  dadosUtilizados: [
                    "Glicemia de jejum: 110 mg/dL",
                    "Insulina: 18 µUI/mL",
                  ],
                  guidelineReferencia:
                    "Consenso Brasileiro de Resistência Insulínica 2020",
                },
                {
                  id: "tyg-index-1",
                  nome: "Índice TyG (Triglicerídeos-Glicose)",
                  categoria: "risco-cardiometabolico",
                  valorCalculado: 8.9,
                  unidade: null,
                  interpretacao:
                    "Valor >8.5 associado a maior risco cardiometabólico",
                  motivoRelevancia:
                    "Marcador alternativo de resistência insulínica e risco cardiovascular",
                  dadosUtilizados: [
                    "Triglicerídeos: 180 mg/dL",
                    "Glicemia: 110 mg/dL",
                  ],
                  guidelineReferencia: "Diretriz de Dislipidemia 2021",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue(mockExames);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.consultas.sugerirIndicesMetabolicos({
      consultaId: 1,
    });

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].nome).toContain("HOMA-IR");
    expect(result[0].categoria).toBe("resistencia-insulinica");
    expect(result[0].valorCalculado).toBe(4.9);
    expect(result[1].nome).toContain("TyG");
    expect(result[1].categoria).toBe("risco-cardiometabolico");
  });

  it("deve retornar array vazio quando não há dados suficientes", async () => {
    // Arrange
    const mockConsulta = {
      id: 2,
      pacienteId: 2,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: null,
      exameFisico: null,
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
              indices: [],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue([]);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.consultas.sugerirIndicesMetabolicos({
      consultaId: 2,
    });

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("deve incluir múltiplas categorias de índices quando relevante", async () => {
    // Arrange
    const mockConsulta = {
      id: 3,
      pacienteId: 3,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Diabetes descompensado",
      },
      exameFisico: {
        peso: "110",
        altura: "170",
      },
      hipotesesDiagnosticas: "Diabetes tipo 2 com esteatose hepática",
      conduta: null,
      observacoes: null,
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExames = [
      {
        id: 1,
        pacienteId: 3,
        medicoId: 1,
        dataExame: new Date(),
        tipoExame: "Perfil Completo",
        resultados: JSON.stringify({
          glicemia: 180,
          hba1c: 9.5,
          alt: 65,
          ast: 55,
          triglicerideos: 250,
        }),
        arquivoUrl: null,
        arquivoPath: null,
        observacoes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              indices: [
                {
                  id: "gmi-1",
                  nome: "GMI (Glucose Management Indicator)",
                  categoria: "controle-glicemico",
                  valorCalculado: 9.5,
                  unidade: "%",
                  interpretacao: "Controle glicêmico inadequado",
                  motivoRelevancia: "Avaliar controle glicêmico global",
                  dadosUtilizados: ["HbA1c: 9.5%"],
                  guidelineReferencia: "ADA 2024",
                },
                {
                  id: "fli-1",
                  nome: "FLI (Fatty Liver Index)",
                  categoria: "esteatose-hepatica",
                  valorCalculado: 75,
                  unidade: null,
                  interpretacao: "Alto risco de esteatose hepática",
                  motivoRelevancia: "Suspeita clínica de esteatose",
                  dadosUtilizados: ["IMC", "Triglicerídeos", "GGT"],
                  guidelineReferencia: "Consenso de Esteatose 2023",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue(mockExames);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.consultas.sugerirIndicesMetabolicos({
      consultaId: 3,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].categoria).toBe("controle-glicemico");
    expect(result[1].categoria).toBe("esteatose-hepatica");
  });
});
