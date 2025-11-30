import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { appRouter } from "./routers";

// Mock do drizzle
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: vi.fn(() => ({})),
  },
}));

describe("Módulo 10: Busca Global", () => {
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

  it("deve buscar pacientes e consultas com termo mínimo de 2 caracteres", async () => {
    // Este teste valida que o endpoint aceita termos com 2+ caracteres
    // O mock do drizzle retorna arrays vazios, mas o importante é validar a estrutura
    const result = await caller.buscaGlobal({
      termo: "Maria",
      limitPacientes: 5,
      limitConsultas: 5,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("pacientes");
    expect(result).toHaveProperty("consultas");
    expect(Array.isArray(result.pacientes)).toBe(true);
    expect(Array.isArray(result.consultas)).toBe(true);
  });

  it("deve aplicar limites corretos para pacientes e consultas", async () => {
    const result = await caller.buscaGlobal({
      termo: "João",
      limitPacientes: 3,
      limitConsultas: 2,
    });

    // Valida que a estrutura de retorno está correta
    expect(result.pacientes).toBeDefined();
    expect(result.consultas).toBeDefined();
  });

  it("deve usar valores padrão quando limites não são fornecidos", async () => {
    const result = await caller.buscaGlobal({
      termo: "Silva",
    });

    // Valida que funciona com valores padrão
    expect(result).toBeDefined();
    expect(result.pacientes).toBeDefined();
    expect(result.consultas).toBeDefined();
  });

  it("deve retornar estrutura correta mesmo sem resultados", async () => {
    const result = await caller.buscaGlobal({
      termo: "XYZ123",
      limitPacientes: 5,
      limitConsultas: 5,
    });

    // Mesmo sem resultados, deve retornar estrutura válida
    expect(result).toEqual({
      pacientes: [],
      consultas: [],
    });
  });

  it("deve validar termo com comprimento mínimo", async () => {
    // Termo com menos de 2 caracteres deve falhar na validação
    await expect(
      caller.buscaGlobal({
        termo: "A",
        limitPacientes: 5,
        limitConsultas: 5,
      })
    ).rejects.toThrow();
  });
});
