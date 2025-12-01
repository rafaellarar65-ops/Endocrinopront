export type PlanoSecao = {
  titulo: string;
  conteudo: string;
};

export type PlanoVersao = {
  publico: "medico" | "paciente";
  secoes: PlanoSecao[];
  checklist?: string[];
  metasSMART?: string[];
};

export type PlanoTemplate = {
  condicao: string;
  blocos: PlanoSecao[];
  placeholders?: Record<string, string>;
};

export type ConsultaResumida = {
  id: number | string;
  data: Date;
  notasSOAP?: { s?: string; o?: string; a?: string; p?: string };
  pesoKg?: number;
  imc?: number;
  glicemiaJejum?: number;
  hba1c?: number;
  conduta?: string;
};

export type ExameResumido = {
  id: number | string;
  data: Date;
  tipo: string;
  resultados: Array<{ parametro: string; valor: number; unidade: string }>;
};

export type BioimpedanciaResumida = {
  id: number | string;
  data: Date;
  peso?: number;
  gorduraPercentual?: number;
  massaMagraKg?: number;
};

export type TimelineEvento = {
  data: Date;
  tipo: "consulta" | "exame" | "bioimpedancia";
  titulo: string;
  descricao?: string;
  badge?: string;
};

export type TimelineFiltro = {
  tipos?: TimelineEvento["tipo"][];
  periodoDias?: number;
};

export type DeltaConsulta = {
  metrica: string;
  valorAnterior?: number;
  valorAtual?: number;
  delta?: number;
  unidade?: string;
};

export type Velocimetro = {
  nome: string;
  valor: number;
  faixa: "baixo" | "moderado" | "alto";
  objetivo?: string;
};

export type DashboardMetabolico = {
  velocimetros: Velocimetro[];
  alertas: string[];
  tendencias: Record<string, "melhora" | "piora" | "estavel">;
};

const MG_DL_TO_MMOL = 0.0555;

function normalizarUnidade(valor: number, unidade: string): { valor: number; unidade: string } {
  if (unidade.toLowerCase() === "mg/dl") {
    return { valor: +(valor * MG_DL_TO_MMOL).toFixed(2), unidade: "mmol/L" };
  }
  return { valor, unidade };
}

export function gerarPlanoDual(
  template: PlanoTemplate,
  dadosPaciente: { nome: string; metas?: string[] }
): { medico: PlanoVersao; paciente: PlanoVersao } {
  const substituido = template.blocos.map((bloco) => {
    let conteudo = bloco.conteudo.replace(/{{nome}}/g, dadosPaciente.nome);
    if (template.placeholders) {
      Object.entries(template.placeholders).forEach(([chave, valor]) => {
        conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, "g"), valor);
      });
    }
    return { ...bloco, conteudo };
  });

  const metas = dadosPaciente.metas ?? [];

  return {
    medico: {
      publico: "medico",
      secoes: substituido,
      metasSMART: metas,
      checklist: [
        "Revisar exames críticos",
        "Confirmar alergias e comorbidades",
        "Documentar justificativas de conduta",
      ],
    },
    paciente: {
      publico: "paciente",
      metasSMART: metas,
      secoes: substituido.map((secao) => ({
        ...secao,
        conteudo: secao.conteudo.replace(/(\*\*[^*]+\*\*)/g, ""),
      })),
      checklist: [
        "Seguir metas combinadas",
        "Registrar sintomas e efeitos colaterais",
        "Marcar retorno conforme orientação",
      ],
    },
  };
}

export function consolidarTimeline(
  consultas: ConsultaResumida[],
  exames: ExameResumido[],
  bioimpedancias: BioimpedanciaResumida[],
  filtro: TimelineFiltro = {}
): TimelineEvento[] {
  const eventos: TimelineEvento[] = [];

  consultas.forEach((consulta) => {
    const soap = consulta.notasSOAP;
    const descricao = [soap?.s, soap?.o, soap?.a, soap?.p]
      .filter(Boolean)
      .map((item, idx) => `${"SOAP"[idx]}: ${item}`)
      .join(" | ");

    const textoConduta = consulta.conduta?.toLowerCase() ?? "";
    const badge = /efeito colateral|evento adverso/.test(textoConduta)
      ? "Alerta"
      : textoConduta.includes("ajuste")
        ? "Ajuste"
        : undefined;

    eventos.push({
      data: consulta.data,
      tipo: "consulta",
      titulo: `Consulta ${consulta.data.toLocaleDateString("pt-BR")}`,
      descricao: descricao || undefined,
      badge,
    });
  });

  exames.forEach((exame) => {
    const totalResultados = exame.resultados.length;
    eventos.push({
      data: exame.data,
      tipo: "exame",
      titulo: `Exame ${exame.tipo}`,
      descricao: `${totalResultados} parâmetros registrados`,
      badge: "Exame",
    });
  });

  bioimpedancias.forEach((bia) => {
    eventos.push({
      data: bia.data,
      tipo: "bioimpedancia",
      titulo: "Bioimpedância",
      descricao: `Peso ${bia.peso ?? "-"} kg | %Gordura ${bia.gorduraPercentual ?? "-"}`,
      badge: "BIA",
    });
  });

  let filtrados = eventos.sort((a, b) => b.data.getTime() - a.data.getTime());

  if (filtro.tipos?.length) {
    filtrados = filtrados.filter((evento) => filtro.tipos?.includes(evento.tipo));
  }

  if (filtro.periodoDias) {
    const limite = Date.now() - filtro.periodoDias * 24 * 60 * 60 * 1000;
    filtrados = filtrados.filter((evento) => evento.data.getTime() >= limite);
  }

  return filtrados;
}

export function calcularDeltasConsultas(consultas: ConsultaResumida[]): DeltaConsulta[] {
  if (consultas.length < 2) return [];
  const ordenadas = [...consultas].sort((a, b) => a.data.getTime() - b.data.getTime());
  const penultima = ordenadas[ordenadas.length - 2];
  const ultima = ordenadas[ordenadas.length - 1];

  const metrica = (nome: string, anterior?: number, atual?: number, unidade?: string): DeltaConsulta => ({
    metrica: nome,
    valorAnterior: anterior,
    valorAtual: atual,
    delta: anterior !== undefined && atual !== undefined ? +(atual - anterior).toFixed(2) : undefined,
    unidade,
  });

  return [
    metrica("Peso", penultima.pesoKg, ultima.pesoKg, "kg"),
    metrica("IMC", penultima.imc, ultima.imc, "kg/m²"),
    metrica("Glicemia jejum", penultima.glicemiaJejum, ultima.glicemiaJejum, "mg/dL"),
    metrica("HbA1c", penultima.hba1c, ultima.hba1c, "%"),
  ].filter((delta) => delta.valorAnterior !== undefined || delta.valorAtual !== undefined);
}

export function gerarDashboardMetabolico(
  exames: ExameResumido[],
  bioimpedancias: BioimpedanciaResumida[]
): DashboardMetabolico {
  const alertas: string[] = [];
  const glicemias = exames.flatMap((exame) =>
    exame.resultados
      .filter((r) => r.parametro.toLowerCase().includes("glicemia"))
      .map((resultado) => normalizarUnidade(resultado.valor, resultado.unidade))
  );

  const glicemiaCritica = exames.some((exame) =>
    exame.resultados.some((r) => {
      if (!r.parametro.toLowerCase().includes("glicemia")) return false;
      if (r.unidade.toLowerCase() === "mg/dl") return r.valor >= 126;
      const normalizada = normalizarUnidade(r.valor, r.unidade);
      return normalizada.valor >= 7;
    })
  );

  const ultimaGlicemia = glicemias.at(-1);
  if (ultimaGlicemia && ultimaGlicemia.valor >= 7) {
    alertas.push("Glicemia em jejum elevada");
  } else if (glicemiaCritica) {
    alertas.push("Glicemia em jejum elevada");
  }

  const hba1cValores = exames
    .flatMap((exame) => exame.resultados)
    .filter((r) => r.parametro.toLowerCase().includes("hba1c"));
  const ultimaHbA1c = hba1cValores.at(-1);
  if (ultimaHbA1c && ultimaHbA1c.valor >= 7) {
    alertas.push("HbA1c acima da meta");
  }

  const ultimaBia = bioimpedancias.at(-1);
  if (ultimaBia?.gorduraPercentual && ultimaBia.gorduraPercentual >= 35) {
    alertas.push("Composição corporal desfavorável");
  }

  const velocimetros: Velocimetro[] = [
    {
      nome: "Controle glicêmico",
      valor: ultimaHbA1c?.valor ?? ultimaGlicemia?.valor ?? 0,
      faixa: ultimaHbA1c?.valor && ultimaHbA1c.valor >= 7 ? "alto" : "moderado",
      objetivo: "HbA1c < 7%",
    },
    {
      nome: "Risco metabólico",
      valor: ultimaBia?.gorduraPercentual ?? 0,
      faixa: ultimaBia?.gorduraPercentual && ultimaBia.gorduraPercentual > 30 ? "alto" : "moderado",
      objetivo: "Gordura < 30%",
    },
  ];

  const tendencias: DashboardMetabolico["tendencias"] = {};
  const pesoSerie = bioimpedancias.map((b) => b.peso).filter((p): p is number => p !== undefined);
  if (pesoSerie.length >= 2) {
    const variacao = pesoSerie[pesoSerie.length - 1] - pesoSerie[0];
    tendencias["peso"] = variacao < 0 ? "melhora" : variacao > 0 ? "piora" : "estavel";
  }

  if (hba1cValores.length >= 2) {
    const variacao = hba1cValores.at(-1)!.valor - hba1cValores[0].valor;
    tendencias["hba1c"] = variacao < 0 ? "melhora" : variacao > 0 ? "piora" : "estavel";
  }

  return { velocimetros, alertas, tendencias };
}
