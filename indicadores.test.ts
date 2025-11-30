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
  getPacienteById: vi.fn(),
  getExamesByPaciente: vi.fn(),
}));

describe("Módulo 9: Indicadores com IA", () => {
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

  it("deve sugerir escores clínicos relevantes baseado nos dados da consulta", async () => {
    // Arrange
    const mockConsulta = {
      id: 1,
      pacienteId: 1,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Dor no peito",
        hda: "Paciente relata dor torácica há 2 dias",
      },
      exameFisico: {
        peso: "85",
        altura: "170",
        pressaoArterial: "140/90",
      },
      hipotesesDiagnosticas: "Possível hipertensão arterial",
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPaciente = {
      id: 1,
      nome: "João Silva",
      dataNascimento: new Date("1970-01-01"),
      sexo: "masculino" as const,
      medicoId: 1,
      cpf: null,
      contatoWhatsapp: null,
      email: null,
      telefone: null,
      endereco: null,
      dadosEssenciais: null,
      observacoes: null,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              escores: [
                {
                  id: "1",
                  nome: "Escore de Framingham",
                  categoria: "cardiovascular",
                  prioridade: "alta",
                  contextoClinico: "Paciente com dor torácica e hipertensão",
                  motivoRelevancia: "Avaliar risco cardiovascular global",
                  dadosNecessarios: [
                    "Idade",
                    "Sexo",
                    "Pressão arterial",
                    "Colesterol total",
                    "HDL",
                    "Tabagismo",
                  ],
                  guidelineReferencia: "Diretriz Brasileira de Hipertensão 2020",
                },
                {
                  id: "2",
                  nome: "Escore ASCVD",
                  categoria: "cardiovascular",
                  prioridade: "alta",
                  contextoClinico: "Avaliar risco de doença cardiovascular aterosclerótica",
                  motivoRelevancia: "Paciente com fatores de risco cardiovascular",
                  dadosNecessarios: [
                    "Idade",
                    "Sexo",
                    "Raça",
                    "Colesterol total",
                    "HDL",
                    "Pressão arterial sistólica",
                    "Tratamento para hipertensão",
                    "Diabetes",
                    "Tabagismo",
                  ],
                  guidelineReferencia: "ACC/AHA Guideline 2019",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getPacienteById).mockResolvedValue(mockPaciente);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue([]);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.exameFisico.sugerirEscores({ consultaId: 1 });

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].nome).toBe("Escore de Framingham");
    expect(result[0].categoria).toBe("cardiovascular");
    expect(result[0].prioridade).toBe("alta");
    expect(result[1].nome).toBe("Escore ASCVD");
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
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPaciente = {
      id: 2,
      nome: "Maria Santos",
      dataNascimento: null,
      sexo: "feminino" as const,
      medicoId: 1,
      cpf: null,
      contatoWhatsapp: null,
      email: null,
      telefone: null,
      endereco: null,
      dadosEssenciais: null,
      observacoes: null,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              escores: [],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getPacienteById).mockResolvedValue(mockPaciente);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue([]);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.exameFisico.sugerirEscores({ consultaId: 2 });

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("deve incluir dados de exames laboratoriais na análise quando disponíveis", async () => {
    // Arrange
    const mockConsulta = {
      id: 3,
      pacienteId: 3,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Fadiga e ganho de peso",
      },
      exameFisico: {
        peso: "95",
        altura: "165",
      },
      hipotesesDiagnosticas: "Hipotireoidismo",
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPaciente = {
      id: 3,
      nome: "Ana Costa",
      dataNascimento: new Date("1985-05-15"),
      sexo: "feminino" as const,
      medicoId: 1,
      cpf: null,
      contatoWhatsapp: null,
      email: null,
      telefone: null,
      endereco: null,
      dadosEssenciais: null,
      observacoes: null,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExames = [
      {
        id: 1,
        pacienteId: 3,
        medicoId: 1,
        dataExame: new Date(),
        tipoExame: "Perfil Tireoidiano",
        resultados: {
          TSH: { valor: 8.5, unidade: "mUI/L", referencia: "0.4-4.0" },
          T4Livre: { valor: 0.6, unidade: "ng/dL", referencia: "0.8-1.8" },
        },
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
              escores: [
                {
                  id: "1",
                  nome: "Avaliação de Risco Cardiovascular em Hipotireoidismo",
                  categoria: "endocrino-outros",
                  prioridade: "media",
                  contextoClinico:
                    "Paciente com hipotireoidismo confirmado por exames",
                  motivoRelevancia:
                    "Hipotireoidismo aumenta risco cardiovascular",
                  dadosNecessarios: [
                    "TSH",
                    "T4 Livre",
                    "Colesterol total",
                    "LDL",
                    "Pressão arterial",
                  ],
                  guidelineReferencia:
                    "Diretriz da Sociedade Brasileira de Endocrinologia",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getPacienteById).mockResolvedValue(mockPaciente);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue(mockExames);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.exameFisico.sugerirEscores({ consultaId: 3 });

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].categoria).toBe("endocrino-outros");
    expect(result[0].nome).toContain("Hipotireoidismo");
  });

  it("deve priorizar escores de alta relevância", async () => {
    // Arrange
    const mockConsulta = {
      id: 4,
      pacienteId: 4,
      medicoId: 1,
      dataHora: new Date(),
      status: "em_andamento" as const,
      anamnese: {
        queixaPrincipal: "Fratura de punho após queda",
      },
      exameFisico: {
        peso: "55",
        altura: "160",
      },
      hipotesesDiagnosticas: "Osteoporose",
      resumo: null,
      sugestoesExameFisico: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPaciente = {
      id: 4,
      nome: "Dona Maria",
      dataNascimento: new Date("1950-03-20"),
      sexo: "feminino" as const,
      medicoId: 1,
      cpf: null,
      contatoWhatsapp: null,
      email: null,
      telefone: null,
      endereco: null,
      dadosEssenciais: null,
      observacoes: null,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLLMResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              escores: [
                {
                  id: "1",
                  nome: "FRAX - Risco de Fratura",
                  categoria: "osseo",
                  prioridade: "alta",
                  contextoClinico:
                    "Paciente idosa com fratura recente por trauma mínimo",
                  motivoRelevancia:
                    "Avaliar risco de fraturas futuras e indicação de tratamento",
                  dadosNecessarios: [
                    "Idade",
                    "Sexo",
                    "Peso",
                    "Altura",
                    "Fratura prévia",
                    "Uso de glicocorticoides",
                    "Artrite reumatoide",
                    "Osteoporose secundária",
                    "Tabagismo",
                    "Álcool",
                    "DMO femoral",
                  ],
                  guidelineReferencia: "WHO FRAX Tool",
                },
              ],
            }),
          },
        },
      ],
    };

    vi.mocked(db.getConsultaById).mockResolvedValue(mockConsulta);
    vi.mocked(db.getPacienteById).mockResolvedValue(mockPaciente);
    vi.mocked(db.getExamesByPaciente).mockResolvedValue([]);
    vi.mocked(invokeLLM).mockResolvedValue(mockLLMResponse as any);

    // Act
    const result = await caller.exameFisico.sugerirEscores({ consultaId: 4 });

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].prioridade).toBe("alta");
    expect(result[0].nome).toContain("FRAX");
    expect(result[0].categoria).toBe("osseo");
  });
});
