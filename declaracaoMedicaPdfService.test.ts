import { describe, it, expect } from "vitest";
import {
  gerarDeclaracaoMedicaHtml,
  gerarDeclaracaoMedicaPdf,
  validarDeclaracaoMedica,
  type DeclaracaoMedicaPayload,
} from "./lib/declaracaoMedicaPdfService";

const payloadBase: DeclaracaoMedicaPayload = {
  pacienteNome: "Maria da Silva",
  medicoNome: "Dra. Ana Souza",
  crm: "CRM-12345",
  dataEmissao: "2024-05-10",
  essenciais: {
    finalidade: "Retorno ao trabalho",
    periodo: {
      inicio: "2024-05-10",
      fim: "2024-05-20",
    },
    assinatura: "digital",
  },
  observacoes: "Paciente em acompanhamento.",
};

describe("declaracaoMedicaPdfService", () => {
  it("valida campos obrigatórios e retorna payload tipado", () => {
    const parsed = validarDeclaracaoMedica(payloadBase);

    expect(parsed.essenciais.finalidade).toBe("Retorno ao trabalho");
    expect(parsed.essenciais.periodo.inicio).toBe("2024-05-10");
    expect(parsed.essenciais.assinatura).toBe("digital");
  });

  it("lança erro quando finalidade está vazia", () => {
    const invalido: DeclaracaoMedicaPayload = {
      ...payloadBase,
      essenciais: {
        ...payloadBase.essenciais,
        finalidade: "",
      },
    };

    expect(() => validarDeclaracaoMedica(invalido)).toThrow(/Finalidade/);
  });

  it("gera HTML incluindo assinatura manual e intervalo", () => {
    const html = gerarDeclaracaoMedicaHtml({
      ...payloadBase,
      essenciais: {
        ...payloadBase.essenciais,
        assinatura: "manual",
      },
    });

    expect(html).toContain("Assinatura manual");
    expect(html).toContain("2024-05-10 até 2024-05-20");
    expect(html).toContain(payloadBase.pacienteNome);
  });

  it("gera buffer e metadados do arquivo PDF", async () => {
    const pdf = await gerarDeclaracaoMedicaPdf(payloadBase);

    expect(pdf.fileName).toBe("declaracao-medica-maria-da-silva.pdf");
    expect(pdf.metadata.assinatura).toBe("digital");
    expect(pdf.buffer.toString("utf-8")).toContain("Declaração Médica");
  });
});
