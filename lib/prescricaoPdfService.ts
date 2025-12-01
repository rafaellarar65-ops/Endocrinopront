import {
  fillReceituarioSVG,
  convertSVGtoPDF,
  type ReceituarioData,
} from "../svgProcessor";

export type AssinaturaTipo = "digital" | "manual";

export interface PrescricaoItemPdfInput {
  nome: string;
  dosagem: string;
  frequencia?: string;
  duracao: string;
  orientacoes?: string;
  via?: string;
}

export interface PrescricaoPdfPayload {
  pacienteNome: string;
  data: string;
  itens: PrescricaoItemPdfInput[];
  observacoes?: string;
  assinaturaTipo?: AssinaturaTipo;
}

export interface PrescricaoPdfOptions {
  converter?: (html: string) => Promise<Buffer>;
  filePrefix?: string;
}

export interface PrescricaoPdfResult {
  pdfBuffer: Buffer;
  fileName: string;
  html: string;
  metadata: {
    paciente: string;
    data: string;
    totalItens: number;
  };
}

const DEFAULT_FILE_PREFIX = "prescricao";

function sanitizeFileName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function formatPosologia(item: PrescricaoItemPdfInput): string {
  const base = [item.dosagem, item.frequencia].filter(Boolean).join(" • ");
  if (item.orientacoes?.trim()) {
    return `${base} • ${item.orientacoes.trim()}`;
  }
  return base;
}

function mapToReceituarioData(payload: PrescricaoPdfPayload): ReceituarioData {
  return {
    nomePaciente: payload.pacienteNome,
    data: payload.data,
    assinaturaTipo: payload.assinaturaTipo,
    medicamentos: payload.itens.map((item) => ({
      nome: item.nome,
      dosagem: item.dosagem,
      via: item.via ?? "Uso conforme orientação clínica",
      posologia: formatPosologia(item),
      duracao: item.duracao,
    })),
    instrucoesAdicionais: payload.observacoes,
  };
}

export async function gerarPrescricaoPdf(
  payload: PrescricaoPdfPayload,
  options: PrescricaoPdfOptions = {}
): Promise<PrescricaoPdfResult> {
  const receituarioData = mapToReceituarioData(payload);
  const html = await fillReceituarioSVG(receituarioData);

  const converter = options.converter ?? convertSVGtoPDF;
  const pdfBuffer = await converter(html);

  const safePatient = sanitizeFileName(payload.pacienteNome || "paciente");
  const safeDate = sanitizeFileName(payload.data || "data");
  const prefix = options.filePrefix ?? DEFAULT_FILE_PREFIX;
  const fileName = `${prefix}-${safePatient}-${safeDate}.pdf`;

  return {
    pdfBuffer,
    fileName,
    html,
    metadata: {
      paciente: payload.pacienteNome,
      data: payload.data,
      totalItens: payload.itens.length,
    },
  };
}

export const __private__ = {
  sanitizeFileName,
  formatPosologia,
  mapToReceituarioData,
};
