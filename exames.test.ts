import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

process.env.DATABASE_URL = process.env.DATABASE_URL || "mysql://user:pass@localhost:3306/test";

vi.mock("./db", () => ({
  createExameLaboratorial: vi.fn(),
  updateExameLaboratorial: vi.fn(),
  deleteExameLaboratorial: vi.fn(),
  getExamesByPaciente: vi.fn(),
}));

const ctx: TrpcContext = {
  user: {
    id: 1,
    openId: "test-user",
    email: "medico@example.com",
    name: "Dr. Teste",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe("Exames laboratoriais", () => {
  const caller = appRouter.createCaller(ctx);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("atribui IDs aos resultados digitados ao criar exame", async () => {
    vi.mocked(db.createExameLaboratorial).mockImplementation(async (data: any) => ({ id: 10, ...data }));

    const exame = await caller.exames.create({
      pacienteId: 1,
      consultaId: 1,
      dataExame: new Date("2024-02-01"),
      tipo: "Hemograma",
      resultados: [
        { parametro: "Hemoglobina", valor: "13.5", unidade: "g/dL", referencia: "12-16", status: "normal" },
      ],
    });

    expect(db.createExameLaboratorial).toHaveBeenCalled();
    const payload = vi.mocked(db.createExameLaboratorial).mock.calls[0][0];
    expect(payload.resultados[0].id).toBeDefined();
    expect(exame.resultados[0].parametro).toBe("Hemoglobina");
  });

  it("normaliza acentos antes de gerar IDs estáveis", async () => {
    vi.mocked(db.createExameLaboratorial).mockImplementation(async (data: any) => ({ id: 11, ...data }));

    const exame = await caller.exames.create({
      pacienteId: 1,
      consultaId: 1,
      dataExame: new Date("2024-04-01"),
      tipo: "Hemograma",
      resultados: [
        { parametro: "Hemoglobína", valor: "13.2", unidade: "g/dL", referencia: "12-16", status: "normal" },
      ],
    });

    expect(db.createExameLaboratorial).toHaveBeenCalled();
    const payload = vi.mocked(db.createExameLaboratorial).mock.calls[0][0];
    expect(payload.resultados[0].id).toBeDefined();
    expect(exame.resultados[0].parametro).toBe("Hemoglobína");
  });

  it("permite atualizar resultados preservando IDs", async () => {
    vi.mocked(db.updateExameLaboratorial).mockImplementation(async (id: number, data: any) => ({ id, ...data }));

    const updated = await caller.exames.update({
      id: 99,
      pacienteId: 1,
      dataExame: new Date("2024-03-10"),
      tipo: "Perfil lipídico",
      resultados: [
        { id: 2, parametro: "LDL", valor: "130", unidade: "mg/dL", referencia: "< 100", status: "alterado" },
      ],
    });

    expect(db.updateExameLaboratorial).toHaveBeenCalled();
    expect(updated?.resultados[0].id).toBe(2);
    expect(updated?.resultados[0].parametro).toBe("LDL");
  });

  it("remove exame e retorna booleano", async () => {
    vi.mocked(db.deleteExameLaboratorial).mockResolvedValue(true);

    const removed = await caller.exames.delete({ id: 55 });

    expect(db.deleteExameLaboratorial).toHaveBeenCalledWith(55);
    expect(removed).toBe(true);
  });

  it("propaga metadata de arquivo ao criar exame (IA ou upload)", async () => {
    vi.mocked(db.createExameLaboratorial).mockImplementation(async (data: any) => ({ id: 77, ...data }));

    await caller.exames.create({
      pacienteId: 9,
      consultaId: 3,
      dataExame: new Date("2024-05-15"),
      tipo: "Perfil lipídico",
      mimeType: "application/pdf",
      fileName: "perfil-lipidico.pdf",
      resultados: [
        { parametro: "LDL", valor: "120", unidade: "mg/dL", referencia: "< 100", status: "alterado" },
      ],
    });

    const payload = vi.mocked(db.createExameLaboratorial).mock.calls[0][0];
    expect(payload.mimeType).toBe("application/pdf");
    expect(payload.fileName).toBe("perfil-lipidico.pdf");
  });
});
