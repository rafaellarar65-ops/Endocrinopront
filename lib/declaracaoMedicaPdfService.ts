import { z } from "zod";
import type {
  DeclaracaoMedicaEssenciais,
  DeclaracaoMedicaPeriodo,
} from "../declaracaoMedica.types";

const periodoSchema = z.object<DeclaracaoMedicaPeriodo>({
  inicio: z.string().min(1, "Período inicial é obrigatório"),
  fim: z.string().min(1, "Período final é obrigatório"),
});

const essenciaisSchema = z.object<DeclaracaoMedicaEssenciais>({
  finalidade: z.string().min(1, "Finalidade é obrigatória"),
  periodo: periodoSchema,
  assinatura: z.enum(["digital", "manual"]),
});

const declaracaoSchema = z.object({
  pacienteNome: z.string().min(1, "Nome do paciente é obrigatório"),
  medicoNome: z.string().min(1, "Nome do médico é obrigatório"),
  crm: z.string().min(1, "CRM é obrigatório"),
  dataEmissao: z.string().min(1, "Data de emissão é obrigatória"),
  essenciais: essenciaisSchema,
  observacoes: z.string().optional(),
});

export type DeclaracaoMedicaPayload = z.infer<typeof declaracaoSchema>;

export function validarDeclaracaoMedica(
  payload: DeclaracaoMedicaPayload
): DeclaracaoMedicaPayload {
  return declaracaoSchema.parse(payload);
}

function assinaturaLabel(assinatura: DeclaracaoMedicaEssenciais["assinatura"]): string {
  return assinatura === "manual"
    ? "Assinatura manual (imprimir e assinar)"
    : "Assinatura digital";
}

export function gerarDeclaracaoMedicaHtml(payload: DeclaracaoMedicaPayload): string {
  const declaracao = validarDeclaracaoMedica(payload);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.6; }
    h1 { color: #1f2937; margin-bottom: 8px; }
    .meta { color: #4b5563; margin-bottom: 24px; }
    .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .label { font-weight: 600; color: #374151; }
    .observacoes { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>Declaração Médica</h1>
  <div class="meta">Emitido em ${declaracao.dataEmissao} por ${declaracao.medicoNome} (${declaracao.crm})</div>
  <div class="box">
    <div><span class="label">Paciente:</span> ${declaracao.pacienteNome}</div>
    <div><span class="label">Finalidade:</span> ${declaracao.essenciais.finalidade}</div>
    <div><span class="label">Período:</span> ${declaracao.essenciais.periodo.inicio} até ${declaracao.essenciais.periodo.fim}</div>
    <div><span class="label">Assinatura:</span> ${assinaturaLabel(declaracao.essenciais.assinatura)}</div>
  </div>
  ${declaracao.observacoes ? `<div class="box observacoes"><span class="label">Observações:</span> ${declaracao.observacoes}</div>` : ""}
</body>
</html>`;
}

function sanitizeFileName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export async function gerarDeclaracaoMedicaPdf(payload: DeclaracaoMedicaPayload) {
  const html = gerarDeclaracaoMedicaHtml(payload);
  const slug = sanitizeFileName(payload.pacienteNome || "paciente");
  const fileName = `declaracao-medica-${slug}.pdf`;

  return {
    fileName,
    buffer: Buffer.from(html, "utf-8"),
    metadata: {
      paciente: payload.pacienteNome,
      dataEmissao: payload.dataEmissao,
      assinatura: payload.essenciais.assinatura,
    },
  } as const;
}
