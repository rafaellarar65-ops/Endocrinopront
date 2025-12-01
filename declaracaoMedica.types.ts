export interface DeclaracaoMedicaPeriodo {
  inicio: string;
  fim: string;
}

export interface DeclaracaoMedicaEssenciais {
  finalidade: string;
  periodo: DeclaracaoMedicaPeriodo;
  assinatura: "digital" | "manual";
}
