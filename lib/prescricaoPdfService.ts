import {
  convertSVGtoPDF,
  fillReceituarioSVG,
  type ReceituarioData,
} from "../svgProcessor";

export interface PrescricaoItem {
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
}

export interface GerarPrescricaoPdfParams {
  pacienteNome: string;
  data: string;
  assinaturaTipo?: "digital" | "manual";
  itens: PrescricaoItem[];
  observacoes?: string;
}

export interface PrescricaoPdfDependencies {
  converter: (html: string) => Promise<Buffer>;
}

export async function gerarPrescricaoPdf(
  params: GerarPrescricaoPdfParams,
  deps: PrescricaoPdfDependencies = { converter: convertSVGtoPDF }
): Promise<{ pdfBuffer: Buffer; html: string }> {
  const receituarioData: ReceituarioData = {
    nomePaciente: params.pacienteNome,
    data: params.data,
    assinaturaTipo: params.assinaturaTipo,
    medicamentos: params.itens.map((item) => ({
      nome: item.nome,
      dosagem: item.dosagem,
      via: item.via,
      posologia: item.frequencia,
      duracao: item.duracao,
    })),
    instrucoesAdicionais: params.observacoes,
  };

  const html = await fillReceituarioSVG(receituarioData);
  const pdfBuffer = await deps.converter(html);

  return {
    pdfBuffer,
    html,
  };
}
