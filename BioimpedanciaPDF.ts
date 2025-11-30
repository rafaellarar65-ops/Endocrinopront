import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Configura as fontes
const pdfMakeInstance = pdfMake as any;
pdfMakeInstance.vfs = pdfFonts;

interface BioimpedanciaData {
  paciente: {
    nome: string;
    cpf: string;
    dataNascimento: string;
    sexo: string;
  };
  bioimpedancia: {
    dataAvaliacao: string;
    resultados: any;
  };
}

export class BioimpedanciaPDF {
  static generate(data: BioimpedanciaData) {
    const { paciente, bioimpedancia } = data;
    const r = bioimpedancia.resultados;

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          {
            text: "RELATÓRIO DE BIOIMPEDÂNCIA",
            style: "header",
            alignment: "center",
          },
        ],
      },
      
      footer: (currentPage: number, pageCount: number) => ({
        margin: [40, 0, 40, 20],
        columns: [
          {
            text: `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
            fontSize: 8,
            color: "#666",
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,