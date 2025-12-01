import { convertSVGtoPDF, uploadPdfBuffer } from "../documentGenerator";
import type { ResumoEvolutivoOutput } from "../ResumoEvolutivoService";
import type { ExameLabData } from "../exames";

export interface PrescricaoResumida {
  dataPrescricao: string;
  observacoes?: string;
  itens: Array<{
    nome: string;
    posologia?: string;
    duracao?: string;
  }>;
}

export interface RelatorioClinicoInput {
  pacienteNome: string;
  dataReferencia: string;
  resumoEvolutivo?: ResumoEvolutivoOutput | null;
  exames?: ExameLabData[];
  prescricoes?: PrescricaoResumida[];
  include?: {
    evolucao?: boolean;
    exames?: boolean;
    prescricoes?: boolean;
  };
  maxCharsPorPagina?: number;
}

export interface RelatorioSecao {
  titulo: string;
  conteudo: string;
}

export interface RelatorioPagina {
  numero: number;
  titulo: string;
  conteudo: string;
}

export interface RelatorioClinicoOutput {
  pdfUrl: string;
  pdfPath: string;
  paginas: number;
  sumario: Array<{ titulo: string; pagina: number }>;
}

const DEFAULT_MAX_CHARS = 1800;

export function mapearSecoesDoRelatorio(input: RelatorioClinicoInput): RelatorioSecao[] {
  const secoes: RelatorioSecao[] = [];

  secoes.push({
    titulo: "Dados do Paciente",
    conteudo: `Paciente: ${input.pacienteNome}\nData de referência: ${input.dataReferencia}`,
  });

  if (input.include?.evolucao !== false && input.resumoEvolutivo) {
    secoes.push({
      titulo: "Evolução Clínica",
      conteudo: [
        input.resumoEvolutivo.resumoConsolidado,
        `Pontos-chave:\n- ${input.resumoEvolutivo.pontosChave.join("\n- ")}`,
        `Evolução: ${input.resumoEvolutivo.evolucaoClinica}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
  }

  if (input.include?.exames !== false && input.exames?.length) {
    const blocos = input.exames.map((exame) => {
      const valores = exame.valores
        .map(
          (valor) =>
            `• ${valor.parametro}: ${valor.valor} ${valor.unidade} (${valor.valorReferencia}) [${valor.status}]`
        )
        .join("\n");

      return [`Tipo: ${exame.tipoExame}`, `Data: ${exame.dataColeta}`, valores].filter(Boolean).join("\n");
    });

    secoes.push({
      titulo: "Exames Laboratoriais",
      conteudo: blocos.join("\n\n"),
    });
  }

  if (input.include?.prescricoes !== false && input.prescricoes?.length) {
    const blocos = input.prescricoes.map((prescricao, idx) => {
      const itens = prescricao.itens
        .map((item, itemIdx) =>
          `${idx + 1}.${itemIdx + 1} ${item.nome}${item.posologia ? ` - ${item.posologia}` : ""}${
            item.duracao ? ` (${item.duracao})` : ""
          }`
        )
        .join("\n");

      return [
        `Prescrição ${idx + 1} - ${prescricao.dataPrescricao}`,
        itens,
        prescricao.observacoes ? `Observações: ${prescricao.observacoes}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    });

    secoes.push({
      titulo: "Prescrições Ativas",
      conteudo: blocos.join("\n\n"),
    });
  }

  return secoes;
}

export function paginarSecoes(
  secoes: RelatorioSecao[],
  maxCharsPorPagina: number = DEFAULT_MAX_CHARS,
  paginaInicial: number = 2
): RelatorioPagina[] {
  const paginas: RelatorioPagina[] = [];
  let numeroAtual = paginaInicial;

  secoes.forEach((secao) => {
    const partes = quebrarConteudo(secao.conteudo, maxCharsPorPagina - secao.titulo.length - 40);

    partes.forEach((parte, index) => {
      paginas.push({
        numero: numeroAtual++,
        titulo: index === 0 ? secao.titulo : `${secao.titulo} (cont.)`,
        conteudo: parte,
      });
    });
  });

  return paginas;
}

function quebrarConteudo(texto: string, maxCharsPorPagina: number): string[] {
  if (texto.length <= maxCharsPorPagina) return [texto];

  const palavras = texto.split(/\s+/);
  const partes: string[] = [];
  let buffer = "";

  palavras.forEach((palavra) => {
    if ((buffer + " " + palavra).trim().length > maxCharsPorPagina) {
      partes.push(buffer.trim());
      buffer = palavra;
    } else {
      buffer = buffer ? `${buffer} ${palavra}` : palavra;
    }
  });

  if (buffer.trim()) {
    partes.push(buffer.trim());
  }

  return partes;
}

export function construirPaginaSumario(paginasConteudo: RelatorioPagina[]): RelatorioPagina {
  const linhas = paginasConteudo.map((pagina) => `• ${pagina.titulo} ............. página ${pagina.numero}`);

  return {
    numero: 1,
    titulo: "Sumário",
    conteudo: linhas.join("\n"),
  };
}

export function construirHtmlRelatorio(
  paginas: RelatorioPagina[],
  pacienteNome: string,
  dataReferencia: string
): string {
  const pageCount = paginas.length;

  const pagesHtml = paginas
    .map(
      (pagina) => `
      <section class="page">
        <header>
          <div class="patient">${escapeHtml(pacienteNome)}</div>
          <div class="date">${escapeHtml(dataReferencia)}</div>
        </header>
        <h2>${escapeHtml(pagina.titulo)}</h2>
        <pre>${escapeHtml(pagina.conteudo)}</pre>
        <footer> Página ${pagina.numero} / ${pageCount} </footer>
      </section>
    `
    )
    .join("\n");

  return `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <style>
          @page { size: A4; margin: 24mm 18mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; }
          .page { page-break-after: always; }
          header { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; color: #4b5563; }
          h2 { color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
          pre { white-space: pre-wrap; word-break: break-word; line-height: 1.5; }
          footer { margin-top: 12px; text-align: right; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function gerarRelatorioClinicoPdf(
  input: RelatorioClinicoInput,
  deps: {
    converter?: (html: string) => Promise<Buffer>;
    uploader?: (path: string, buffer: Buffer) => Promise<{ pdfUrl: string; pdfPath: string }>;
    agora?: () => number;
  } = {}
): Promise<RelatorioClinicoOutput> {
  const maxChars = input.maxCharsPorPagina ?? DEFAULT_MAX_CHARS;
  const converter = deps.converter ?? convertSVGtoPDF;
  const uploader = deps.uploader ?? uploadPdfBuffer;
  const agora = deps.agora ?? Date.now;

  const secoes = mapearSecoesDoRelatorio(input);
  const paginasConteudo = paginarSecoes(secoes, maxChars);
  const paginaSumario = construirPaginaSumario(paginasConteudo);
  const paginas = [paginaSumario, ...paginasConteudo];

  const html = construirHtmlRelatorio(paginas, input.pacienteNome, input.dataReferencia);

  const pdfBuffer = await converter(html);
  const fileName = `relatorio-clinico-${slugify(input.pacienteNome)}-${agora()}.pdf`;
  const fileKey = `documentos/relatorios/${fileName}`;

  const resultadoUpload = await uploader(fileKey, pdfBuffer);

  return {
    ...resultadoUpload,
    paginas: paginas.length,
    sumario: paginasConteudo.map((pagina) => ({ titulo: pagina.titulo, pagina: pagina.numero })),
  };
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
