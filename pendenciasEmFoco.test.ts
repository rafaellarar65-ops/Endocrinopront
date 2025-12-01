import { describe, expect, it } from "vitest";
import {
  calcularDeltasConsultas,
  consolidarTimeline,
  gerarDashboardMetabolico,
  gerarPlanoDual,
  PlanoTemplate,
} from "./shared/pendenciasEmFoco";

describe("gerarPlanoDual", () => {
  it("gera versões distintas com placeholders substituídos", () => {
    const template: PlanoTemplate = {
      condicao: "DM2",
      blocos: [
        { titulo: "Diagnóstico", conteudo: "**DM2** confirmado em {{ano}}" },
        { titulo: "Metas", conteudo: "{{nome}} com meta de HbA1c < 7%" },
      ],
      placeholders: { ano: "2024" },
    };

    const { medico, paciente } = gerarPlanoDual(template, {
      nome: "Ana",
      metas: ["HbA1c < 7%", "Perder 3kg em 90 dias"],
    });

    expect(medico.secoes[0].conteudo).toContain("DM2");
    expect(paciente.secoes[1].conteudo).toContain("Ana");
    expect(paciente.checklist?.length).toBeGreaterThan(0);
  });
});

describe("consolidarTimeline", () => {
  const baseDate = new Date("2024-01-01");

  it("consolida consultas, exames e bioimpedâncias com filtros", () => {
    const eventos = consolidarTimeline(
      [
        {
          id: 1,
          data: new Date(baseDate),
          notasSOAP: { s: "fadiga", p: "aumentar dose" },
          conduta: "ajuste de metformina",
        },
      ],
      [
        {
          id: 2,
          data: new Date("2024-01-10"),
          tipo: "Hemograma",
          resultados: [{ parametro: "Glicemia", valor: 110, unidade: "mg/dL" }],
        },
      ],
      [
        {
          id: 3,
          data: new Date("2024-02-01"),
          peso: 80,
          gorduraPercentual: 32,
        },
      ],
      { tipos: ["consulta", "bioimpedancia"] }
    );

    expect(eventos.some((e) => e.tipo === "exame")).toBe(false);
    expect(eventos[0].badge).toBe("BIA");
  });
});

describe("calcularDeltasConsultas", () => {
  it("calcula deltas entre consultas sequenciais", () => {
    const deltas = calcularDeltasConsultas([
      { id: 1, data: new Date("2024-01-01"), pesoKg: 82, imc: 30 },
      { id: 2, data: new Date("2024-02-01"), pesoKg: 80, imc: 29.5, glicemiaJejum: 120 },
    ]);

    expect(deltas.find((d) => d.metrica === "Peso")?.delta).toBe(-2);
    expect(deltas.find((d) => d.metrica === "IMC")?.delta).toBeCloseTo(-0.5);
  });
});

describe("gerarDashboardMetabolico", () => {
  it("gera alertas e velocímetros com normalização de unidades", () => {
    const dashboard = gerarDashboardMetabolico(
      [
        {
          id: 1,
          data: new Date("2024-02-10"),
          tipo: "Painel metabólico",
          resultados: [
            { parametro: "Glicemia", valor: 126, unidade: "mg/dL" },
            { parametro: "HbA1c", valor: 7.2, unidade: "%" },
          ],
        },
      ],
      [
        {
          id: 2,
          data: new Date("2024-02-11"),
          peso: 78,
          gorduraPercentual: 36,
        },
      ]
    );

    expect(dashboard.alertas).toEqual([
      "Glicemia em jejum elevada",
      "HbA1c acima da meta",
      "Composição corporal desfavorável",
    ]);
    expect(dashboard.velocimetros[0].valor).toBeGreaterThan(6);
    expect(dashboard.tendencias.peso).toBeUndefined();
  });
});
