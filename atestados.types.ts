import { z } from "zod";

export const atestadoSchema = z.object({
  pacienteNome: z.string().min(1, "Nome do paciente é obrigatório"),
  pacienteIdade: z.coerce
    .number()
    .int()
    .min(0, "Idade inválida")
    .max(120, "Idade inválida"),
  dataEmissao: z.string().min(1, "Data de emissão é obrigatória"),
  cid: z.string().min(1, "CID é obrigatório"),
  diagnostico: z.string().min(1, "Diagnóstico é obrigatório"),
  recomendacoes: z.string().min(1, "Recomendações são obrigatórias"),
  afastamentoDias: z.coerce
    .number()
    .int()
    .min(1, "Informe o número de dias de afastamento"),
  medicoNome: z.string().min(1, "Nome do médico é obrigatório"),
  crm: z.string().min(3, "CRM é obrigatório"),
  observacoes: z.string().optional(),
});

export type AtestadoSchema = z.infer<typeof atestadoSchema>;
