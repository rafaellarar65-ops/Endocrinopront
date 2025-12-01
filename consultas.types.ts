export type CategoriaEscore =
  | "cardiovascular"
  | "metabolico"
  | "osseo"
  | "renal"
  | "hepatico"
  | "endocrino-outros"
  | "fragilidade"
  | "psiquiatrico"
  | "obesidade"
  | "riscos-medicamentosos"
  | "outros";

export interface EscoreSugestao {
  id: string; // identificador curto, ex: "ascvd-10y", "frax-major"
  nome: string; // nome completo do escore
  categoria: CategoriaEscore;
  contextoClinico: string; // em que situação este escore é relevante para ESTE paciente
  motivoRelevancia: string; // racional clínico, ligado ao quadro atual
  dadosNecessarios: string[]; // dados exigidos para calcular o escore
  prioridade: "alta" | "media" | "baixa";
  guidelineReferencia?: string; // ACC/AHA tal, KDIGO tal, etc.
}

export interface SolicitacaoExameItem {
  nome: string;
  justificativa?: string;
  orientacoes?: string;
}

export interface SolicitacaoExamesPayload {
  consultaId?: number;
  paciente?: { id?: number; nome?: string };
  medico?: { nome?: string; crm?: string };
  data?: string;
  itens: SolicitacaoExameItem[];
  observacoes?: string;
}
