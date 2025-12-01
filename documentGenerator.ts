/**
 * Serviço para gerar documentos médicos (receituários, bioimpedância, etc.)
 */

import { fillBioimpedanciaSVG, convertSVGtoPDF, type BioimpedanciaData } from "./svgProcessor";
import { storagePut } from "../storage";
import { gerarPrescricaoPdf } from "./lib/prescricaoPdfService";

export interface GenerateReceituarioParams {
  pacienteNome: string;
  data: string;
  assinaturaTipo?: "digital" | "manual";
  medicamentos: Array<{
    nome: string;
    dosagem: string;
    via: string;
    posologia: string;
    duracao: string;
  }>;
  instrucoesAdicionais?: string;
}

export interface GenerateBioimpedanciaParams {
  paciente: {
    nome: string;
    nascimento: string;
    idade: number;
    genero: string;
  };
  exame: {
    data: string;
    hora: string;
    peso: number;
    altura: number;
  };
  resultados: {
    aguaCorporal: number;
    proteinas: number;
    minerais: number;
    gorduraCorporal: number;
    massaMagra: number;
    smm: number;
    bmi: number;
    pbf: number;
    whr: number;
    weightControl: number;
    fatControl: number;
    muscleControl: number;
  };
}

/**
 * Gera receituário em PDF e faz upload para S3
 */
export async function generateReceituarioPDF(
  params: GenerateReceituarioParams,
  pacienteId: number
): Promise<{ pdfUrl: string; pdfPath: string }> {
  const { pdfBuffer } = await gerarPrescricaoPdf(
    {
      pacienteNome: params.pacienteNome,
      data: params.data,
      assinaturaTipo: params.assinaturaTipo,
      itens: params.medicamentos.map((medicamento) => ({
        nome: medicamento.nome,
        dosagem: medicamento.dosagem,
        frequencia: medicamento.posologia,
        duracao: medicamento.duracao,
        via: medicamento.via,
      })),
      observacoes: params.instrucoesAdicionais,
    },
    {
      converter: convertSVGtoPDF,
      filePrefix: "receituario",
    }
  );

  // Upload para S3
  const timestamp = Date.now();
  const fileName = `receituario-${pacienteId}-${timestamp}.pdf`;
  const fileKey = `documentos/${pacienteId}/${fileName}`;

  const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return {
    pdfUrl,
    pdfPath: fileKey,
  };
}

/**
 * Gera relatório de bioimpedância em PDF e faz upload para S3
 */
export async function generateBioimpedanciaPDF(
  params: GenerateBioimpedanciaParams,
  pacienteId: number
): Promise<{ pdfUrl: string; pdfPath: string }> {
  // Preparar dados para o template
  const data: BioimpedanciaData = {
    nome: params.paciente.nome,
    nascimento: params.paciente.nascimento,
    idade: params.paciente.idade,
    genero: params.paciente.genero,
    dataExame: params.exame.data,
    horaExame: params.exame.hora,
    peso: params.exame.peso,
    altura: params.exame.altura,
    imc: params.resultados.bmi,
    aguaCorporal: params.resultados.aguaCorporal,
    proteinas: params.resultados.proteinas,
    minerais: params.resultados.minerais,
    gorduraCorporal: params.resultados.gorduraCorporal,
    massaMagra: params.resultados.massaMagra,
    protein: "Normal", // TODO: calcular baseado em faixas de referência
    mineral: "Normal",
    fat: "Normal",
    weightControl: params.resultados.weightControl,
    fatControl: params.resultados.fatControl,
    muscleControl: params.resultados.muscleControl,
    smm: params.resultados.smm,
    bmi: params.resultados.bmi,
    pbf: params.resultados.pbf,
    whr: params.resultados.whr,
  };

  // Preencher SVG com dados
  const svgContent = await fillBioimpedanciaSVG(data);

  // Converter para PDF
  const pdfBuffer = await convertSVGtoPDF(svgContent);

  // Upload para S3
  const timestamp = Date.now();
  const fileName = `bioimpedancia-${pacienteId}-${timestamp}.pdf`;
  const fileKey = `documentos/${pacienteId}/${fileName}`;

  const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return {
    pdfUrl,
    pdfPath: fileKey,
  };
}
