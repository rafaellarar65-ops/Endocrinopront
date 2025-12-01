export interface EscoreCatalogoEntry {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  variaveisPrincipais?: string[];
  referencia?: string;
}

export const ESCORES_CATALOGO: EscoreCatalogoEntry[] = [
  {
    id: "prevent",
    nome: "PREVENT (Risco Cardiovascular)",
    categoria: "cardiometabolico",
    descricao:
      "Estimativa de risco cardiovascular global em 10 anos considerando fatores clássicos e metabólicos.",
    variaveisPrincipais: ["idade", "sexo", "pressao", "ldl", "hdl", "tabagismo"],
    referencia: "Diretrizes Brasileiras de Cardiologia 2023",
  },
  {
    id: "frax",
    nome: "FRAX (Risco de Fratura)",
    categoria: "osteometabolico",
    descricao:
      "Calcula risco de fratura osteoporótica maior e de quadril em 10 anos com base em fatores clínicos e DMO.",
    variaveisPrincipais: ["idade", "sexo", "imc", "dmohip", "tabagismo", "alcool"],
    referencia: "IOF/OMS",
  },
  {
    id: "homa-ir",
    nome: "HOMA-IR",
    categoria: "resistencia-insulinica",
    descricao:
      "Índice de resistência insulínica baseado em glicemia e insulina de jejum, útil em síndrome metabólica e DM2.",
    variaveisPrincipais: ["glicemia", "insulina"],
    referencia: "Consenso Brasileiro de RI 2020",
  },
  {
    id: "tyg-index",
    nome: "TyG Index",
    categoria: "resistencia-insulinica",
    descricao:
      "Marcador alternativo de resistência insulínica e risco cardiometabólico combinando triglicerídeos e glicemia.",
    variaveisPrincipais: ["glicemia", "triglicerideos"],
    referencia: "Diretriz Dislipidemia 2021",
  },
  {
    id: "fli",
    nome: "FLI (Fatty Liver Index)",
    categoria: "esteatose-hepatica",
    descricao:
      "Probabilidade de esteatose hepática baseada em IMC, circunferência abdominal, triglicerídeos e GGT.",
    variaveisPrincipais: ["imc", "circunferencia", "triglicerideos", "ggt"],
    referencia: "Consenso Esteatose 2023",
  },
  {
    id: "lms",
    nome: "Leeds Activity Score (LES DMT2)",
    categoria: "controle-glicemico",
    descricao:
      "Avalia controle glicêmico e atividade de doença em DM2 para acompanhamento longitudinal.",
    variaveisPrincipais: ["hba1c", "glicemias", "medicacoes"],
  },
  {
    id: "ascvd",
    nome: "ASCVD (Pooled Cohort)",
    categoria: "cardiometabolico",
    descricao:
      "Risco de eventos ateroscleróticos maiores em 10 anos; útil na decisão sobre estatinas/aspirina.",
    variaveisPrincipais: ["idade", "sexo", "ldl", "hdl", "pressao", "tabagismo"],
  },
  {
    id: "maq",
    nome: "MAQ (Hipotireoidismo Subclínico)",
    categoria: "tireoide",
    descricao:
      "Score auxiliar para decidir tratamento de hipotireoidismo subclínico considerando sintomas e marcadores.",
    variaveisPrincipais: ["tsh", "t4Livre", "anticorpos", "sintomas"],
  },
  {
    id: "dasi",
    nome: "DASI (Capacidade Funcional)",
    categoria: "capacidade-funcional",
    descricao:
      "Questionário para estimar capacidade funcional e VO2; útil em avaliação pré-operatória ou CV.",
    variaveisPrincipais: ["atividade", "dispneia", "angina"],
  },
  {
    id: "charlson",
    nome: "Índice de Charlson",
    categoria: "multimorbidade",
    descricao:
      "Estimativa de mortalidade a partir de múltiplas comorbidades, auxilia em prognóstico e priorização.",
    variaveisPrincipais: ["comorbidades", "idade"],
  },
];
