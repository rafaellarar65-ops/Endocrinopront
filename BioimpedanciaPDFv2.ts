import pdfMake from "pdfmake/build/pdfmake";
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

export class BioimpedanciaPDFv2 {
  static generate(data: BioimpedanciaData) {
    const { paciente, bioimpedancia } = data;
    const r = bioimpedancia.resultados;

    // Calcular idade
    const idade = paciente.dataNascimento
      ? new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
      : 0;

    const docDefinition: any = {
      pageSize: "A4",
      pageOrientation: "portrait",
      pageMargins: [0, 0, 0, 0],
      
      content: [
        {
          columns: [
            // BARRA LATERAL AZUL
            {
              width: 120,
              stack: [
                // Logo (placeholder - será substituído por imagem real)
                {
                  text: "Rafael Lara",
                  fontSize: 16,
                  bold: true,
                  color: "white",
                  alignment: "center",
                  margin: [0, 20, 0, 5],
                },
                {
                  text: "Endocrinologia",
                  fontSize: 9,
                  color: "white",
                  alignment: "center",
                  margin: [0, 0, 0, 20],
                },
                
                // Dados do Paciente
                {
                  text: "Nome:",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 5, 10, 2],
                },
                {
                  text: paciente.nome,
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  margin: [10, 0, 10, 8],
                },
                
                {
                  text: "Idade:",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 0, 10, 2],
                },
                {
                  text: `${idade} anos`,
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  margin: [10, 0, 10, 8],
                },
                
                {
                  text: "Sexo:",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 0, 10, 2],
                },
                {
                  text: paciente.sexo === "M" ? "Masculino" : "Feminino",
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  margin: [10, 0, 10, 8],
                },
                
                {
                  text: "Altura:",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 0, 10, 2],
                },
                {
                  text: `${r?.altura || "N/A"} cm`,
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  margin: [10, 0, 10, 8],
                },
                
                {
                  text: "Data:",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 0, 10, 2],
                },
                {
                  text: new Date(bioimpedancia.dataAvaliacao).toLocaleDateString("pt-BR"),
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  margin: [10, 0, 10, 20],
                },
                
                // Weight Control
                {
                  text: "Weight Control",
                  fontSize: 10,
                  bold: true,
                  color: "white",
                  alignment: "center",
                  margin: [0, 10, 0, 10],
                  background: "#8B5CF6",
                },
                
                {
                  table: {
                    widths: ["50%", "50%"],
                    body: [
                      [
                        { text: "Peso", fontSize: 7, color: "white", border: [false, false, false, false] },
                        { text: `${r?.peso || "N/A"} kg`, fontSize: 8, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                      [
                        { text: "Músculo", fontSize: 7, color: "white", border: [false, false, false, false] },
                        { text: `${r?.massaMuscular || "N/A"} kg`, fontSize: 8, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                      [
                        { text: "Gordura", fontSize: 7, color: "white", border: [false, false, false, false] },
                        { text: `${r?.massaGorda || "N/A"} kg`, fontSize: 8, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                    ],
                  },
                  margin: [10, 0, 10, 20],
                },
                
                // Índices calculados
                {
                  text: "Índices",
                  fontSize: 8,
                  color: "white",
                  margin: [10, 0, 10, 5],
                },
                {
                  table: {
                    widths: ["50%", "50%"],
                    body: [
                      [
                        { text: "IMC", fontSize: 7, color: "white", border: [false, false, false, false] },
                        { text: r?.imc || "N/A", fontSize: 8, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                      [
                        { text: "PGC", fontSize: 7, color: "white", border: [false, false, false, false] },
                        { text: `${r?.percentualGordura || "N/A"}%`, fontSize: 8, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                    ],
                  },
                  margin: [10, 0, 10, 0],
                },
              ],
              fillColor: "#2C5AA0",
            },
            
            // ÁREA PRINCIPAL
            {
              width: "*",
              stack: [
                // Cabeçalho
                {
                  text: "Análise Corporal",
                  fontSize: 18,
                  bold: true,
                  color: "#2C5AA0",
                  alignment: "center",
                  margin: [0, 15, 0, 15],
                },
                
                // Composição Corporal
                {
                  text: "COMPOSIÇÃO CORPORAL",
                  fontSize: 10,
                  bold: true,
                  color: "#666",
                  margin: [20, 0, 20, 10],
                },
                
                // Tabela de composição com barras
                {
                  table: {
                    widths: ["35%", "15%", "35%", "15%"],
                    body: [
                      [
                        { text: "Água Corporal", fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.aguaCorporal || "N/A"} L`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: this.createProgressBar(parseFloat(r?.percentualAgua || "0"), 40, 60), fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.percentualAgua || "N/A"}%`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                      ],
                      [
                        { text: "Proteína", fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.proteina || "N/A"} kg`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: this.createProgressBar(parseFloat(r?.percentualProteina || "0"), 15, 25), fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.percentualProteina || "N/A"}%`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                      ],
                      [
                        { text: "Minerais", fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.salInorganico || "N/A"} kg`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: this.createProgressBar(parseFloat(r?.percentualMinerais || "0"), 3, 5), fontSize: 8, border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                        { text: `${r?.percentualMinerais || "N/A"}%`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, true], borderColor: ["#ddd", "#ddd", "#ddd", "#ddd"] },
                      ],
                      [
                        { text: "Gordura Corporal", fontSize: 8, border: [false, false, false, false] },
                        { text: `${r?.massaGorda || "N/A"} kg`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, false] },
                        { text: this.createProgressBar(parseFloat(r?.percentualGordura || "0"), 10, 30), fontSize: 8, border: [false, false, false, false] },
                        { text: `${r?.percentualGordura || "N/A"}%`, fontSize: 8, bold: true, alignment: "center", border: [false, false, false, false] },
                      ],
                    ],
                  },
                  margin: [20, 0, 20, 20],
                  layout: {
                    defaultBorder: false,
                  },
                },
                
                // Análise Músculo-Gordura
                {
                  text: "ANÁLISE MÚSCULO-GORDURA",
                  fontSize: 10,
                  bold: true,
                  color: "#666",
                  margin: [20, 10, 20, 10],
                },
                
                {
                  columns: [
                    {
                      width: "50%",
                      stack: [
                        {
                          text: "Peso (kg)",
                          fontSize: 9,
                          bold: true,
                          margin: [20, 0, 0, 5],
                        },
                        {
                          canvas: [
                            // Escala de peso
                            { type: "line", x1: 20, y1: 10, x2: 220, y2: 10, lineWidth: 2, lineColor: "#ddd" },
                            // Marcador de peso atual
                            { type: "rect", x: this.calculatePosition(parseFloat(r?.peso || "0"), 40, 100, 200), y: 5, w: 3, h: 10, color: "#000" },
                          ],
                          margin: [0, 0, 0, 5],
                        },
                        {
                          text: `${r?.peso || "N/A"} kg`,
                          fontSize: 10,
                          bold: true,
                          alignment: "center",
                        },
                      ],
                    },
                    {
                      width: "50%",
                      stack: [
                        {
                          text: "Músculo (kg)",
                          fontSize: 9,
                          bold: true,
                          margin: [20, 0, 0, 5],
                        },
                        {
                          canvas: [
                            // Escala de músculo
                            { type: "line", x1: 20, y1: 10, x2: 220, y2: 10, lineWidth: 2, lineColor: "#ddd" },
                            // Marcador de músculo atual
                            { type: "rect", x: this.calculatePosition(parseFloat(r?.massaMuscular || "0"), 20, 60, 200), y: 5, w: 3, h: 10, color: "#000" },
                          ],
                          margin: [0, 0, 0, 5],
                        },
                        {
                          text: `${r?.massaMuscular || "N/A"} kg`,
                          fontSize: 10,
                          bold: true,
                          alignment: "center",
                        },
                      ],
                    },
                  ],
                  margin: [0, 0, 0, 20],
                },
                
                // Análise Segmentar
                {
                  text: "ANÁLISE SEGMENTAR - MASSA MUSCULAR",
                  fontSize: 10,
                  bold: true,
                  color: "white",
                  fillColor: "#2C5AA0",
                  margin: [20, 10, 20, 10],
                  alignment: "center",
                },
                
                {
                  columns: [
                    // Tabela de valores
                    {
                      width: "60%",
                      table: {
                        widths: ["30%", "35%", "35%"],
                        body: [
                          [
                            { text: "Segmento", fontSize: 8, bold: true, fillColor: "#f0f0f0" },
                            { text: "Massa (kg)", fontSize: 8, bold: true, fillColor: "#f0f0f0", alignment: "center" },
                            { text: "Taxa (%)", fontSize: 8, bold: true, fillColor: "#f0f0f0", alignment: "center" },
                          ],
                          [
                            { text: "Braço Esq.", fontSize: 8 },
                            { text: r?.musculoBracoEsq || "N/A", fontSize: 8, alignment: "center" },
                            { text: r?.taxaMusculoBracoEsq || "N/A", fontSize: 8, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Braço Dir.", fontSize: 8 },
                            { text: r?.musculoBracoDir || "N/A", fontSize: 8, alignment: "center" },
                            { text: r?.taxaMusculoBracoDir || "N/A", fontSize: 8, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Esq.", fontSize: 8 },
                            { text: r?.musculoPernaEsq || "N/A", fontSize: 8, alignment: "center" },
                            { text: r?.taxaMusculoPernaEsq || "N/A", fontSize: 8, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Dir.", fontSize: 8 },
                            { text: r?.musculoPernaDir || "N/A", fontSize: 8, alignment: "center" },
                            { text: r?.taxaMusculoPernaDir || "N/A", fontSize: 8, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Tronco", fontSize: 8 },
                            { text: r?.musculoTronco || "N/A", fontSize: 8, alignment: "center" },
                            { text: r?.taxaMusculoTronco || "N/A", fontSize: 8, alignment: "center", bold: true },
                          ],
                        ],
                      },
                      margin: [20, 0, 10, 0],
                    },
                    // Avatar (placeholder - será SVG)
                    {
                      width: "40%",
                      text: "[Avatar Segmentar]",
                      fontSize: 10,
                      alignment: "center",
                      margin: [0, 20, 20, 0],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: "#2C5AA0",
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: "#666",
          margin: [0, 10, 0, 5],
        },
      },
    };

    return pdfMakeInstance.createPdf(docDefinition);
  }

  static download(data: BioimpedanciaData) {
    const pdf = this.generate(data);
    const filename = `bioimpedancia_${data.paciente.nome.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.download(filename);
  }

  static print(data: BioimpedanciaData) {
    const pdf = this.generate(data);
    pdf.print();
  }

  // Helper para criar barra de progresso com canvas
  private static createProgressBar(value: number, min: number, max: number) {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    
    return {
      canvas: [
        // Fundo da barra (cinza)
        { type: "rect", x: 0, y: 0, w: 150, h: 8, color: "#E5E7EB" },
        // Barra de progresso (colorida)
        { type: "rect", x: 0, y: 0, w: (percentage / 100) * 150, h: 8, color: this.getBarColor(percentage) },
      ],
    };
  }
  
  // Helper para cor da barra baseada na percentagem
  private static getBarColor(percentage: number): string {
    if (percentage < 40) return "#F59E0B"; // Laranja (baixo)
    if (percentage < 60) return "#10B981"; // Verde (normal)
    return "#EF4444"; // Vermelho (alto)
  }

  // Helper para calcular posição em escala
  private static calculatePosition(value: number, min: number, max: number, width: number): number {
    const percentage = ((value - min) / (max - min)) * 100;
    return (percentage / 100) * width;
  }
}
