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
      const atual = seriesMap.get(parametroId) ?? {
        id: parametroId,
        parametro: resultado.parametro,
        unidade: resultado.unidade,
        pontos: [],
      };

      atual.pontos.push({
        data: data.toISOString(),
        valor: valorNumerico,
        exameId: exame.id,
        tipo: exame.tipo,
        laboratorio: exame.laboratorio,
      });

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
