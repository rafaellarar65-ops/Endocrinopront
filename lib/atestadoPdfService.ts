import { atestadoSchema, type AtestadoSchema } from "../atestados.types";

export interface AtestadoPdfPayload {
  fileName: string;
  content: Uint8Array;
  metadata: {
    paciente: string;
    data: string;
    cid: string;
    afastamentoDias: number;
  };
}

export function formatAtestadoLayout(data: AtestadoSchema): string {
  const header = "ATTESTADO MÉDICO";
  const blocoPaciente = [
    `Paciente: ${data.pacienteNome} (${data.pacienteIdade} anos)`,
    `Data de emissão: ${data.dataEmissao}`,
    `CID informado: ${data.cid}`,
  ].join("\n");

  const blocoClinico = [
    "Dados Clínicos:",
    `- Diagnóstico: ${data.diagnostico}`,
    `- Recomendações: ${data.recomendacoes}`,
    `- Afastamento sugerido: ${data.afastamentoDias} dia(s)`,
  ].join("\n");

  const blocoProfissional = [
    "Profissional Responsável:",
    `- Médico: ${data.medicoNome}`,
    `- CRM: ${data.crm}`,
  ].join("\n");

  const blocoObservacoes = data.observacoes
    ? `Observações adicionais:\n${data.observacoes}`
    : "";

  return [header, "", blocoPaciente, "", blocoClinico, "", blocoProfissional, "", blocoObservacoes]
    .filter(Boolean)
    .join("\n");
}

export function generateAtestadoPdf(input: AtestadoSchema): AtestadoPdfPayload {
  const parsed = atestadoSchema.parse(input);
  const layout = formatAtestadoLayout(parsed);

  const pseudoPdf = [
    "%PDF-1.4",
    "%âãÏÓ",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${layout.length} >> stream`,
    layout,
    "endstream endobj",
    "xref 0 5",
    "0000000000 65535 f ",
    "trailer << /Size 5 /Root 1 0 R >>",
    "startxref",
    "0",
    "%%EOF",
  ].join("\n");

  const encoder = new TextEncoder();
  const content = encoder.encode(pseudoPdf);
  const fileName = `atestado-${sanitizeFileName(parsed.pacienteNome)}.pdf`;

  return {
    fileName,
    content,
    metadata: {
      paciente: parsed.pacienteNome,
      data: parsed.dataEmissao,
      cid: parsed.cid,
      afastamentoDias: parsed.afastamentoDias,
    },
  };
}

function sanitizeFileName(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
