import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapEncaminhamentoDados } from "./encaminhamento";
import {
  generateEncaminhamentoPdf,
  renderEncaminhamentoHtml,
} from "./lib/encaminhamentoPdfService";

vi.mock("./svgProcessor", () => ({
  convertSVGtoPDF: vi.fn(async (html: string) =>
    Buffer.from(`pdf:${html.length}`)
  ),
}));

describe("Encaminhamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapeia dados obrigatórios com preenchimento e normalização", () => {
    const mapped = mapEncaminhamentoDados({
      especialidade: "  cardiologia  ",
      motivo: "Avaliar sopros ou dor torácica",
      historico: "Paciente com IMC elevado",
      paciente: { nome: "  Ana Paula  ", idade: 45, sexo: "F" },
      medico: { nome: "Dr. Silva", crm: "1234" },
    });

    expect(mapped.especialidade).toBe("cardiologia");
    expect(mapped.motivo).toContain("Avaliar sopros");
    expect(mapped.historicoClinico).toContain("IMC");
    expect(mapped.paciente.nome).toBe("Ana Paula");
    expect(mapped.medico?.crm).toBe("1234");
  });

  it("aplica valores padrão quando campos não são informados", () => {
    const mapped = mapEncaminhamentoDados({ paciente: { nome: "Rafael" } });

    expect(mapped.especialidade).toBe("Especialidade não informada");
    expect(mapped.motivo).toBe("Motivo não informado");
    expect(mapped.historicoClinico).toContain("Histórico clínico não informado");
  });

  it("monta HTML estruturado com seções de layout reutilizáveis", () => {
    const data = mapEncaminhamentoDados({
      especialidade: "Endocrinologia",
      motivo: "Hipotireoidismo refratário",
      historico: "TSH persistentemente elevado, em uso de levotiroxina 100mcg",
      observacoes: "Retornar laudos laboratoriais recentes",
      paciente: { nome: "Juliana" },
      medico: { nome: "Dr. João", crm: "9988" },
    });

    const html = renderEncaminhamentoHtml(data);

    expect(html).toContain("Encaminhamento médico");
    expect(html).toContain("<span class=\"pill\">Endocrinologia</span>");
    expect(html).toContain("Motivo do encaminhamento");
    expect(html).toContain("Histórico clínico relevante");
    expect(html).toContain("Observações adicionais");
    expect(html).toContain("--primary: #2c5aa0");
    expect(html.match(/class=\"section\"/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("gera buffer PDF a partir do HTML formatado", async () => {
    const data = mapEncaminhamentoDados({
      especialidade: "Nefrologia",
      motivo: "Deterioração de função renal",
      historico: "Creatinina progressivamente crescente nos últimos 6 meses",
      paciente: { nome: "Carlos" },
    });

    const buffer = await generateEncaminhamentoPdf(data);
    const { convertSVGtoPDF } = await import("./svgProcessor");

    expect(convertSVGtoPDF).toHaveBeenCalledTimes(1);
    const htmlPassado = vi.mocked(convertSVGtoPDF).mock.calls[0][0];
    expect(htmlPassado).toContain("Nefrologia");
    expect(buffer.toString()).toMatch(/^pdf:\d+/);
  });
});
