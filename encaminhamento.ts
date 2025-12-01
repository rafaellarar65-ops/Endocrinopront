import { z } from "zod";

export const encaminhamentoSchema = z.object({
  especialidade: z.string().min(1, "Especialidade é obrigatória"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  historicoClinico: z.string().min(1, "Histórico clínico é obrigatório"),
  paciente: z.object({
    nome: z.string().min(1, "Nome do paciente é obrigatório"),
    idade: z.number().int().positive().optional(),
    sexo: z.string().optional(),
  }),
  medico: z
    .object({
      nome: z.string().optional(),
      crm: z.string().optional(),
      especialidade: z.string().optional(),
    })
    .optional(),
  observacoes: z.string().optional(),
});

export type EncaminhamentoData = z.infer<typeof encaminhamentoSchema>;

interface MapEncaminhamentoParams {
  especialidade?: string;
  motivo?: string;
  historico?: string;
  paciente?: {
    nome?: string;
    idade?: number;
    sexo?: string;
  };
  medico?: {
    nome?: string;
    crm?: string;
    especialidade?: string;
  };
  observacoes?: string;
}

export function mapEncaminhamentoDados(
  params: MapEncaminhamentoParams
): EncaminhamentoData {
  const paciente = params.paciente ?? {};

  const normalized: EncaminhamentoData = {
    especialidade: params.especialidade?.trim() || "Especialidade não informada",
    motivo: params.motivo?.trim() || "Motivo não informado",
    historicoClinico:
      params.historico?.trim() || "Histórico clínico não informado pelo médico.",
    observacoes: params.observacoes?.trim() || undefined,
    paciente: {
      nome: (paciente.nome || "Paciente não identificado").trim(),
      idade: paciente.idade,
      sexo: paciente.sexo?.trim(),
    },
    medico: params.medico
      ? {
          nome: params.medico.nome?.trim() || undefined,
          crm: params.medico.crm?.trim() || undefined,
          especialidade: params.medico.especialidade?.trim() || undefined,
        }
      : undefined,
  };

  return encaminhamentoSchema.parse(normalized);
}
