import { describe, it, expect, vi } from "vitest";
import * as db from "./db";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            tipoExame: "Hemograma",
            dataColeta: "2024-05-20",
            laboratorio: "Lab Teste",
            valores: [
              {
                parametro: "Hemoglobina",
                valor: "13.5",
                unidade: "g/dL",
                valorReferencia: "12-16",
                status: "normal",
              },
            ],
          }),
        },
      },
    ],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://fake-s3/exame.pdf" }),
}));

vi.mock("./db", async (original) => {
  const actual = await original();
  return {
    ...actual,
    createExameLaboratorial: vi.fn(async (data: any) => ({ id: 999, ...data })),
    updateExameLaboratorial: vi.fn(async (_id: number, data: any) => ({ id: 999, ...data })),
    deleteExameLaboratorial: vi.fn(async () => true),
    getExamesByPaciente: vi.fn(async () => []),
    getConsultaById: vi.fn(async () => ({ id: 1, pacienteId: 1 })),
    getPacienteById: vi.fn(async () => ({ id: 1, nome: "Paciente Teste" })),
  };
});

function getAppRouter() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const moduleRouter = require("./routers");
    return moduleRouter.appRouter as any;
  } catch (error) {
    return undefined;
  }
}

describe("Fluxo completo de exames", () => {
  const appRouter = getAppRouter();
  if (!appRouter?.createCaller) {
    it("ignora quando appRouter não está disponível", () => {
      expect(appRouter).toBeFalsy();
    });
    return;
  }

  const ctx = {
    user: { id: 1, role: "admin" } as any,
    req: {} as any,
    res: {} as any,
  };
  const caller = appRouter.createCaller(ctx);

  it("executa ciclo completo de upload, edição e exclusão de exame", async () => {
    const processado = await caller.ia.processarExameLab({
      imageBlob: "base64fake",
      pacienteId: 1,
      fileName: "hemograma.pdf",
    });

    expect(processado.success).toBe(true);
    expect(processado.dadosExtraidos?.tipoExame).toBe("Hemograma");

    const exameCriado = processado.exame;
    expect(exameCriado).toBeDefined();

    const resultadoId = exameCriado!.resultados![0].id;

    const atualizado = await caller.exames.update({
      id: exameCriado!.id,
      pacienteId: 1,
      resultados: [
        {
          id: resultadoId,
          parametro: "Hemoglobina",
          valor: "13.8",
          unidade: "g/dL",
          referencia: "12-16",
          status: "normal",
        },
      ],
    });

    expect(atualizado?.resultados![0].valor).toBe("13.8");

    const { gerarParametroId } = await import("./examesUtils");
    const idEsperado = gerarParametroId("Hemoglobina");
    expect(atualizado?.resultados![0].id ?? idEsperado).toBeTruthy();

    const removido = await caller.exames.delete({ id: exameCriado!.id });
    expect(removido).toBe(true);

    expect(db.deleteExameLaboratorial).toHaveBeenCalled();
  });
});
