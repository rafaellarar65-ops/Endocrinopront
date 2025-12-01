import { describe, expect, it, vi } from "vitest";
import {
  construirHtmlRelatorio,
  construirPaginaSumario,
  gerarRelatorioClinicoPdf,
  mapearSecoesDoRelatorio,
  paginarSecoes,
} from "./lib/relatorioClinicoPdfService";

describe("relatorioClinicoPdfService", () => {
  const resumoEvolutivo = {
    resumoConsolidado: "Paciente com evolução favorável.",
    pontosChave: ["melhora da dor", "redução da insulina"],
    evolucaoClinica: "Melhora",
  };

  it("mapeia dados agregados em seções opcionais", () => {
    const secoes = mapearSecoesDoRelatorio({
      pacienteNome: "Maria Silva",
      dataReferencia: "2024-05-20",
      resumoEvolutivo,
      exames: [
        {
          tipoExame: "Glicemia",
          dataColeta: "2024-05-18",
          valores: [
            {
              parametro: "Glicemia em jejum",
              valor: "92",
              unidade: "mg/dL",
              valorReferencia: "70-99",
              status: "normal",
            },
          ],
        },
      ],
      prescricoes: [
        {
          dataPrescricao: "2024-05-19",
          observacoes: "Avaliar adesão",
          itens: [{ nome: "Metformina", posologia: "850mg 2x/dia", duracao: "90 dias" }],
        },
      ],
    });

    expect(secoes.map((s) => s.titulo)).toContain("Evolução Clínica");
    expect(secoes.map((s) => s.titulo)).toContain("Exames Laboratoriais");
    expect(secoes.map((s) => s.titulo)).toContain("Prescrições Ativas");
    expect(secoes.find((s) => s.titulo === "Evolução Clínica")?.conteudo).toContain("Pontos-chave");
  });

  it("remove seções desativadas e garante paginação com sumário", () => {
    const secoes = mapearSecoesDoRelatorio({
      pacienteNome: "João Souza",
      dataReferencia: "2024-05-20",
      resumoEvolutivo,
      include: { exames: false, prescricoes: false },
    });

    const paginasConteudo = paginarSecoes(secoes, 80);
    const paginaSumario = construirPaginaSumario(paginasConteudo);

    expect(secoes.map((s) => s.titulo)).not.toContain("Exames Laboratoriais");
    expect(paginasConteudo.length).toBeGreaterThanOrEqual(1);
    expect(paginaSumario.titulo).toBe("Sumário");
    expect(paginaSumario.conteudo).toContain("Evolução Clínica");
  });

  it("gera HTML paginado e delega PDF/upload via dependências", async () => {
    const converter = vi.fn().mockResolvedValue(Buffer.from("pdf"));
    const uploader = vi.fn().mockResolvedValue({ pdfUrl: "http://cdn/pdf", pdfPath: "documentos/relatorios/teste.pdf" });

    const resultado = await gerarRelatorioClinicoPdf(
      {
        pacienteNome: "Paciente Teste",
        dataReferencia: "2024-05-20",
        resumoEvolutivo,
        maxCharsPorPagina: 50,
      },
      { converter, uploader, agora: () => 123 }
    );

    expect(converter).toHaveBeenCalled();
    expect(uploader).toHaveBeenCalledWith(expect.stringContaining("relatorio-clinico-paciente-teste-123.pdf"), expect.any(Buffer));
    expect(resultado.paginas).toBeGreaterThanOrEqual(1);

    const html = construirHtmlRelatorio(
      [
        {
          numero: 1,
          titulo: "Sumário",
          conteudo: "conteúdo de sumário",
        },
        {
          numero: 2,
          titulo: "Dados",
          conteudo: "dados paginados",
        },
      ],
      "Paciente Teste",
      "2024-05-20"
    );

    expect(html).toContain("Paciente Teste");
    expect(html).toContain("Dados");
  });
});
