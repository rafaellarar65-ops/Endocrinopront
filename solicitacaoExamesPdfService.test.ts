import { describe, expect, it } from "vitest";
import {
  formatarSolicitacaoExames,
  gerarPdfSolicitacaoExames,
} from "./lib/solicitacaoExamesPdfService";
import { SolicitacaoExamesPayload } from "./consultas.types";

describe("solicitacaoExamesPdfService", () => {
  const payloadBase: SolicitacaoExamesPayload = {
    consultaId: 42,
    paciente: { id: 10, nome: "Maria da Silva" },
    medico: { nome: "Dra. Joana", crm: "12345" },
    data: "2024-05-20",
    itens: [
      {
        nome: "Hemograma completo",
        justificativa: "Rastreio anual",
        orientacoes: "Jejum de 8h",
      },
      {
        nome: "TSH",
        justificativa: "Acompanhar hipotireoidismo",
      },
    ],
    observacoes: "Enviar resultados pelo aplicativo",
  };

  it("formata a solicitação com cabeçalho e itens", () => {
    const texto = formatarSolicitacaoExames(payloadBase);

    expect(texto).toContain("Solicitação de Exames Laboratoriais");
    expect(texto).toContain("Data: 2024-05-20");
    expect(texto).toContain("Paciente: Maria da Silva");
    expect(texto).toContain("Médico responsável: Dra. Joana • CRM 12345");
    expect(texto).toContain("1. Hemograma completo");
    expect(texto).toContain("Justificativa: Rastreio anual");
    expect(texto).toContain("Orientações: Jejum de 8h");
    expect(texto).toContain("2. TSH");
    expect(texto).toContain("Observações adicionais:\nEnviar resultados pelo aplicativo");
  });

  it("gera buffer em UTF-8 com todos os exames listados", () => {
    const resultado = gerarPdfSolicitacaoExames(payloadBase);
    const textoDecodificado = new TextDecoder().decode(resultado.pdfBuffer);

    expect(resultado.fileName).toBe("solicitacao-exames-Maria-da-Silva-2024-05-20.pdf");
    expect(textoDecodificado).toContain("Hemograma completo");
    expect(textoDecodificado).toContain("TSH");
  });

  it("ignora itens vazios e normaliza campos opcionais", () => {
    const payloadComVazios: SolicitacaoExamesPayload = {
      itens: [
        { nome: "", justificativa: "  ", orientacoes: "  " },
        { nome: "Cortisol", justificativa: "Atenção a sintomas matinais" },
      ],
    };

    const texto = formatarSolicitacaoExames(payloadComVazios);

    const secoes = texto.split("Exames solicitados:\n\n")[1];

    expect(secoes).toContain("1. Cortisol");
    expect(secoes).not.toContain("2.");
  });
});
