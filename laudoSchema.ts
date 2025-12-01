import { z } from "zod";

export const laudoAchadoSchema = z.object({
  titulo: z.string().min(1, "Título do achado é obrigatório"),
  descricao: z.string().min(1, "Descrição do achado é obrigatória"),
});

export const laudoCarimboSchema = z.object({
  profissional: z.string().min(1, "Identificação do profissional é obrigatória"),
  registro: z.string().min(1, "Registro profissional é obrigatório"),
  assinaturaDigital: z.string().min(1, "Assinatura/carimbo é obrigatório"),
});

export const laudoSchema = z.object({
  paciente: z.object({
    id: z.number().int().positive(),
    nome: z.string().min(1, "Nome do paciente é obrigatório"),
    documento: z.string().optional(),
  }),
  dataEmissao: z.string().min(1, "Data de emissão é obrigatória"),
  achados: z
    .array(laudoAchadoSchema)
    .min(1, "Informe ao menos um achado clínico relevante"),
  conclusao: z.string().min(1, "Conclusão é obrigatória"),
  carimbo: laudoCarimboSchema,
  observacoes: z.string().optional(),
});

export type Laudo = z.infer<typeof laudoSchema>;
export type LaudoAchado = z.infer<typeof laudoAchadoSchema>;
export type LaudoCarimbo = z.infer<typeof laudoCarimboSchema>;
