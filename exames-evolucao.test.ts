import { describe, it, expect } from "vitest";
import { montarSeriesEvolucao, parseValorNumerico } from "./examesUtils";

describe("examesUtils", () => {
  it("converte strings com vírgula para número", () => {
    expect(parseValorNumerico("5,6")).toBe(5.6);
    expect(parseValorNumerico("120 mg/dL")).toBe(120);
    expect(parseValorNumerico("texto")).toBeNull();
  });

  it("gera séries somente para parâmetros com 2+ registros", () => {
    const series = montarSeriesEvolucao([
      {
        id: 1,
        dataExame: "2024-01-01",
        tipo: "Hemograma",
        laboratorio: "Lab A",
        resultados: [
          { id: 1, parametro: "Hemoglobina", valor: "13.2", unidade: "g/dL" },
          { id: 2, parametro: "RDW", valor: "12.0", unidade: "%" },
        ],
      },
      {
        id: 2,
        dataExame: "2024-03-01",
        tipo: "Hemograma",
        laboratorio: "Lab B",
        resultados: [
          { id: 1, parametro: "Hemoglobina", valor: "13,8", unidade: "g/dL" },
          { id: 2, parametro: "RDW", valor: "12.4", unidade: "%" },
        ],
      },
      {
        id: 3,
        dataExame: "2024-04-15",
        tipo: "Hemograma",
        laboratorio: "Lab B",
        resultados: [{ id: 3, parametro: "Leucócitos", valor: "9.000", unidade: "mil/mm3" }],
      },
    ]);

    expect(series.length).toBe(2);
    const hemoglobina = series.find((s) => s.id === 1);
    expect(hemoglobina?.pontos.length).toBe(2);
    expect(hemoglobina?.pontos[0].valor).toBe(13.2);
    expect(hemoglobina?.pontos[1].valor).toBe(13.8);
  });

  it("converte unidades diferentes e sinaliza aviso", () => {
    const series = montarSeriesEvolucao([
      {
        id: 1,
        dataExame: "2024-01-01",
        tipo: "Glicemia",
        laboratorio: "Lab A",
        resultados: [
          { parametro: "Glicemia", valor: "5.5", unidade: "mmol/L" },
        ],
      },
      {
        id: 2,
        dataExame: "2024-02-01",
        tipo: "Glicemia",
        laboratorio: "Lab B",
        resultados: [
          { parametro: "Glicemia", valor: "99", unidade: "mg/dL" },
        ],
      },
    ]);

    expect(series.length).toBe(1);
    const glicemia = series[0];
    expect(glicemia.unidadeBase).toBe("mg/dL");
    expect(glicemia.avisoUnidade).toBeDefined();
    // 5.5 mmol/L ~ 99 mg/dL, valores devem ficar próximos após conversão
    expect(Math.round(glicemia.pontos[0].valor)).toBe(99);
    expect(glicemia.pontos[1].valor).toBe(99);
  });
});
