export const PARAMETRO_ID_MAP: Record<string, number> = {
  hemoglobina: 1,
  rdw: 2,
  leucocitos: 3,
  leucocito: 3,
  plaquetas: 4,
  hematocrito: 5,
  glicemia: 6,
  hba1c: 7,
  tsh: 8,
  t4livre: 9,
  creatinina: 10,
  ureia: 11,
};

export function normalizarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "");
}

export function gerarParametroId(parametro: string, fallbackOffset: number = 1000) {
  const slug = normalizarSlug(parametro);
  const mapped = PARAMETRO_ID_MAP[slug as keyof typeof PARAMETRO_ID_MAP];
  if (mapped) return mapped;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return fallbackOffset + (hash % 9000);
}

export function parseValorNumerico(valor?: string | null): number | null {
  if (valor === undefined || valor === null) return null;
  const sanitized = valor.toString().replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!sanitized) return null;
  const parsed = Number(sanitized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

type UnidadeNormalizada = {
  chave: string;
  rotulo: string;
};

const UNIDADE_MAP: Record<string, UnidadeNormalizada> = {
  "mg/dl": { chave: "mg/dl", rotulo: "mg/dL" },
  "mg%": { chave: "mg/dl", rotulo: "mg/dL" },
  "mmol/l": { chave: "mmol/l", rotulo: "mmol/L" },
  "%": { chave: "%", rotulo: "%" },
  "g/dl": { chave: "g/dl", rotulo: "g/dL" },
};

function normalizarUnidade(unidade?: string | null): UnidadeNormalizada | null {
  if (!unidade) return null;
  const normalized = unidade.toLowerCase().trim();
  return UNIDADE_MAP[normalized] ?? { chave: normalized, rotulo: unidade };
}

const CONVERSOES_BASE: Record<string, (valor: number) => number> = {
  // Conversões aproximadas para séries com misto de unidades
  "mmol/l->mg/dl": (v) => v * 18,
};

function converterParaBase(valor: number, unidadeAtual: UnidadeNormalizada, unidadeBase: UnidadeNormalizada): {
  valorConvertido: number;
  aviso?: string;
} {
  if (unidadeAtual.chave === unidadeBase.chave) return { valorConvertido: valor };

  const chaveConversao = `${unidadeAtual.chave}->${unidadeBase.chave}`;
  const conversor = CONVERSOES_BASE[chaveConversao];
  if (!conversor) {
    return {
      valorConvertido: valor,
      aviso: `Valores possuem unidades diferentes (${unidadeAtual.rotulo} vs ${unidadeBase.rotulo}). Série exibida sem conversão precisa.`,
    };
  }

  return {
    valorConvertido: conversor(valor),
    aviso: `Valores convertidos de ${unidadeAtual.rotulo} para ${unidadeBase.rotulo} (conversão aproximada).`,
  };
}

export type ResultadoExame = {
  id?: number;
  parametro: string;
  valor: string;
  unidade?: string;
  referencia?: string;
  status?: string;
};

export type ExameComResultados = {
  id: number;
  dataExame: string | Date;
  tipo?: string | null;
  laboratorio?: string | null;
  resultados?: ResultadoExame[] | null;
};

export type SerieEvolucao = {
  id: number;
  parametro: string;
  unidade?: string;
  unidadeBase?: string;
  avisoUnidade?: string;
  pontos: Array<{ data: string; valor: number; exameId: number; tipo?: string | null; laboratorio?: string | null }>;
};

export function montarSeriesEvolucao(exames: ExameComResultados[]): SerieEvolucao[] {
  const seriesMap = new Map<number, SerieEvolucao>();

  exames.forEach((exame) => {
    const data = new Date(exame.dataExame);
    if (!exame.resultados) return;

    exame.resultados.forEach((resultado, index) => {
      const valorNumerico = parseValorNumerico(resultado.valor);
      if (valorNumerico === null) return;

      const parametroId = resultado.id ?? gerarParametroId(resultado.parametro, 2000 + index);
      const unidadeNormalizada = normalizarUnidade(resultado.unidade);
      const atual = seriesMap.get(parametroId) ?? {
        id: parametroId,
        parametro: resultado.parametro,
        unidade: unidadeNormalizada?.rotulo ?? resultado.unidade,
        unidadeBase: unidadeNormalizada?.rotulo ?? resultado.unidade,
        pontos: [],
      };

      const unidadeBase = atual.unidadeBase ? normalizarUnidade(atual.unidadeBase) : unidadeNormalizada;
      const conversao = unidadeBase && unidadeNormalizada
        ? converterParaBase(valorNumerico, unidadeNormalizada, unidadeBase)
        : { valorConvertido: valorNumerico };

      atual.pontos.push({
        data: data.toISOString(),
        valor: conversao.valorConvertido,
        exameId: exame.id,
        tipo: exame.tipo,
        laboratorio: exame.laboratorio,
      });

      atual.unidadeBase = unidadeBase?.rotulo ?? atual.unidadeBase;
      if (conversao.aviso) {
        atual.avisoUnidade = conversao.aviso;
      }

      seriesMap.set(parametroId, atual);
    });
  });

  return Array.from(seriesMap.values())
    .map((serie) => ({
      ...serie,
      pontos: serie.pontos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    }))
    .filter((serie) => serie.pontos.length >= 2);
}
