import { describe, expect, it } from "vitest";
import { atestadoSchema } from "./atestados.types";
import { formatAtestadoLayout, generateAtestadoPdf } from "./lib/atestadoPdfService";

const validPayload = {
  pacienteNome: "Paciente Exemplo",
  pacienteIdade: 34,
  dataEmissao: "2024-05-20",
  cid: "M54.5",
  diagnostico: "Lombalgia aguda",
  recomendacoes: "Repouso relativo e analgésico conforme prescrição.",
  afastamentoDias: 5,
  medicoNome: "Dra. Ana Clara",
  crm: "12345-DF",
  observacoes: "Retornar em caso de piora da dor.",
};

describe("Atestados - schema e geração de PDF", () => {
  it("valida campos obrigatórios", () => {
    const parsed = atestadoSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("rejeita payload sem campos obrigatórios", () => {
    const parsed = atestadoSchema.safeParse({ ...validPayload, cid: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toContain("cid");
    }
  });

  it("monta layout textual com campos clínicos", () => {
    const layout = formatAtestadoLayout(validPayload);
    expect(layout).toContain("ATTESTADO MÉDICO");
    expect(layout).toContain("Paciente: Paciente Exemplo (34 anos)");
    expect(layout).toContain("CID informado: M54.5");
    expect(layout).toContain("Recomendações: Repouso relativo e analgésico conforme prescrição.");
    expect(layout).toContain("CRM: 12345-DF");
  });

  it("gera artefato pseudo-PDF com metadados e conteúdo", () => {
    const payload = generateAtestadoPdf(validPayload);
    const decoder = new TextDecoder();
    const pdfText = decoder.decode(payload.content);

    expect(payload.fileName).toContain("atestado-paciente-exemplo.pdf");
    expect(payload.metadata.paciente).toBe(validPayload.pacienteNome);
    expect(payload.metadata.cid).toBe(validPayload.cid);
    expect(pdfText).toContain("%PDF-1.4");
    expect(pdfText).toContain("Paciente: Paciente Exemplo (34 anos)");
    expect(pdfText).toContain("Afastamento sugerido: 5 dia(s)");
  });

  it("lança erro ao tentar gerar PDF com dados inválidos", () => {
    expect(() =>
      generateAtestadoPdf({ ...validPayload, pacienteNome: "", recomendacoes: "" })
    ).toThrowError();
  });
});
