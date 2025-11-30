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
  historico?: Array<{
    dataAvaliacao: string | Date;
    resultados: any;
  }>;
}

export class BioimpedanciaPDFInBody {
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
            // BARRA LATERAL AZUL (20% da largura)
            {
              width: 120,
              stack: [
                // Logo placeholder
                {
                  text: "RAFAEL LARA",
                  fontSize: 11,
                  bold: true,
                  color: "white",
                  alignment: "center",
                  margin: [0, 15, 0, 2],
                },
                {
                  text: "Endocrinologia",
                  fontSize: 7,
                  color: "white",
                  alignment: "center",
                  margin: [0, 0, 0, 2],
                },
                {
                  text: "CRM-BA 12345",
                  fontSize: 6,
                  color: "white",
                  alignment: "center",
                  margin: [0, 0, 0, 12],
                },
                
                // Dados do paciente
                ...this.createSidebarField("Nome:", paciente.nome, 6, 7),
                ...this.createSidebarField("Idade:", `${idade} anos`, 6, 7),
                ...this.createSidebarField("Sexo:", paciente.sexo === "M" ? "Masculino" : "Feminino", 6, 7),
                ...this.createSidebarField("Altura:", `${r?.altura || "N/A"} cm`, 6, 7),
                ...this.createSidebarField("Data:", new Date(bioimpedancia.dataAvaliacao).toLocaleDateString("pt-BR"), 6, 7),
                
                // Espaçador
                { text: "", margin: [0, 0, 0, 8] },
                
                // Weight Control
                {
                  text: "Weight Control",
                  fontSize: 8,
                  bold: true,
                  color: "white",
                  alignment: "center",
                  margin: [10, 0, 10, 6],
                  fillColor: "#8B5CF6",
                  padding: [0, 4, 0, 4],
                },
                
                {
                  table: {
                    widths: ["50%", "50%"],
                    body: [
                      [
                        { text: "Peso", fontSize: 6, color: "white", border: [false, false, false, false] },
                        { text: `${r?.peso || "N/A"} kg`, fontSize: 7, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                      [
                        { text: "Músculo", fontSize: 6, color: "white", border: [false, false, false, false] },
                        { text: `${r?.massaMuscular || "N/A"} kg`, fontSize: 7, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                      [
                        { text: "Gordura", fontSize: 6, color: "white", border: [false, false, false, false] },
                        { text: `${r?.massaGorda || "N/A"} kg`, fontSize: 7, bold: true, color: "white", alignment: "right", border: [false, false, false, false] },
                      ],
                    ],
                  },
                  margin: [10, 0, 10, 8],
                },
                
                // Índices
                {
                  table: {
                    widths: ["50%", "50%"],
                    body: [
                      [
                        { text: "IMC", fontSize: 6, color: "white", fillColor: "#2C5AA0", border: [false, false, false, false], padding: [5, 2, 0, 2] },
                        { text: r?.imc || "N/A", fontSize: 7, bold: true, color: "white", fillColor: "#2C5AA0", alignment: "right", border: [false, false, false, false], padding: [0, 2, 5, 2] },
                      ],
                      [
                        { text: "PGC", fontSize: 6, color: "white", fillColor: "#2C5AA0", border: [false, false, false, false], padding: [5, 2, 0, 2] },
                        { text: `${r?.percentualGordura || "N/A"}%`, fontSize: 7, bold: true, color: "white", fillColor: "#2C5AA0", alignment: "right", border: [false, false, false, false], padding: [0, 2, 5, 2] },
                      ],
                    ],
                  },
                  margin: [10, 0, 10, 0],
                },
              ],
              fillColor: "#2C5AA0",
            },
            
            // ÁREA PRINCIPAL (80% da largura)
            {
              width: "*",
              stack: [
                // Cabeçalho
                {
                  text: "Análise Corporal",
                  fontSize: 16,
                  bold: true,
                  color: "#2C5AA0",
                  alignment: "center",
                  margin: [0, 12, 0, 12],
                },
                
                // Análise Músculo-Gordura (PRIORITÁRIO)
                {
                  text: "ANÁLISE MÚSCULO-GORDURA",
                  fontSize: 8,
                  bold: true,
                  color: "white",
                  fillColor: "#9CA3AF",
                  margin: [15, 0, 15, 0],
                  alignment: "center",
                  padding: [0, 3, 0, 3],
                },
                
                {
                  table: {
                    widths: ["20%", "15%", "50%", "15%"],
                    body: [
                      [
                        { text: "", border: [false, false, false, false] },
                        { text: "Abaixo", fontSize: 6, alignment: "center", fillColor: "#FEF3C7", border: [false, false, false, false] },
                        { text: "Normal", fontSize: 6, alignment: "center", fillColor: "#D1FAE5", border: [false, false, false, false] },
                        { text: "Acima", fontSize: 6, alignment: "center", fillColor: "#FEE2E2", border: [false, false, false, false] },
                      ],
                      ...this.createMusculoGorduraRow("Peso", r?.peso, r?.sexo === "M" ? 60 : 50, r?.sexo === "M" ? 85 : 70, "kg"),
                      ...this.createMusculoGorduraRow("Massa Muscular\nEsquelética", r?.massaMuscular, r?.sexo === "M" ? 25 : 20, r?.sexo === "M" ? 40 : 30, "kg"),
                      ...this.createMusculoGorduraRow("Massa de Gordura", r?.massaGorda, r?.sexo === "M" ? 8 : 12, r?.sexo === "M" ? 18 : 25, "kg"),
                    ],
                  },
                  margin: [15, 0, 15, 10],
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => "#E5E7EB",
                    vLineColor: () => "#E5E7EB",
                  },
                },
                
                // Análise de Gordura de Segmento (PRIORITÁRIO)
                {
                  text: "ANÁLISE DE GORDURA DE SEGMENTO",
                  fontSize: 8,
                  bold: true,
                  color: "white",
                  fillColor: "#9CA3AF",
                  margin: [15, 5, 15, 0],
                  alignment: "center",
                  padding: [0, 3, 0, 3],
                },
                
                {
                  columns: [
                    // Tabela de valores
                    {
                      width: "55%",
                      table: {
                        widths: ["35%", "32.5%", "32.5%"],
                        body: [
                          [
                            { text: "Segmento", fontSize: 7, bold: true, fillColor: "#F3F4F6" },
                            { text: "Gordura (kg)", fontSize: 7, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                            { text: "Taxa (%)", fontSize: 7, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                          ],
                          [
                            { text: "Braço Esq.", fontSize: 6 },
                            { text: r?.gorduraBracoEsq || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaGorduraBracoEsq || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Braço Dir.", fontSize: 6 },
                            { text: r?.gorduraBracoDir || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaGorduraBracoDir || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Esq.", fontSize: 6 },
                            { text: r?.gorduraPernaEsq || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaGorduraPernaEsq || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Dir.", fontSize: 6 },
                            { text: r?.gorduraPernaDir || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaGorduraPernaDir || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Tronco", fontSize: 6 },
                            { text: r?.gorduraTronco || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaGorduraTronco || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                        ],
                      },
                      margin: [15, 0, 10, 0],
                    },
                    // Avatar de Gordura SVG + Legenda
                    {
                      width: "45%",
                      stack: [
                        {
                          svg: this.generateGorduraAvatarSVG(r),
                          margin: [0, 0, 0, 5],
                        },
                        // Legenda de cores
                        {
                          table: {
                            widths: ["15%", "85%"],
                            body: [
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#10B981" }], border: [false, false, false, false] },
                                { text: "Baixo (<15%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#F59E0B" }], border: [false, false, false, false] },
                                { text: "Normal (15-25%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#EF4444" }], border: [false, false, false, false] },
                                { text: "Alto (>25%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                            ],
                          },
                          margin: [10, 0, 15, 0],
                        },
                      ],
                    },
                  ],
                },
                
                // Análise Segmentar - Massa Muscular
                {
                  text: "ANÁLISE SEGMENTAR - MASSA MUSCULAR",
                  fontSize: 8,
                  bold: true,
                  color: "white",
                  fillColor: "#2C5AA0",
                  margin: [15, 8, 15, 0],
                  alignment: "center",
                  padding: [0, 3, 0, 3],
                },
                
                {
                  columns: [
                    // Tabela de valores
                    {
                      width: "55%",
                      table: {
                        widths: ["35%", "32.5%", "32.5%"],
                        body: [
                          [
                            { text: "Segmento", fontSize: 7, bold: true, fillColor: "#F3F4F6" },
                            { text: "Massa (kg)", fontSize: 7, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                            { text: "Taxa (%)", fontSize: 7, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                          ],
                          [
                            { text: "Braço Esq.", fontSize: 6 },
                            { text: r?.musculoBracoEsq || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaMusculoBracoEsq || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Braço Dir.", fontSize: 6 },
                            { text: r?.musculoBracoDir || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaMusculoBracoDir || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Esq.", fontSize: 6 },
                            { text: r?.musculoPernaEsq || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaMusculoPernaEsq || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Dir.", fontSize: 6 },
                            { text: r?.musculoPernaDir || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaMusculoPernaDir || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Tronco", fontSize: 6 },
                            { text: r?.musculoTronco || "N/A", fontSize: 6, alignment: "center" },
                            { text: r?.taxaMusculoTronco || "N/A", fontSize: 6, alignment: "center", bold: true },
                          ],
                        ],
                      },
                      margin: [15, 0, 10, 0],
                    },
                    // Avatar Muscular SVG + Legenda
                    {
                      width: "45%",
                      stack: [
                        {
                          svg: this.generateMusculoAvatarSVG(r),
                          margin: [0, 0, 0, 5],
                        },
                        // Legenda de cores
                        {
                          table: {
                            widths: ["15%", "85%"],
                            body: [
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#EF4444" }], border: [false, false, false, false] },
                                { text: "Baixo (<80%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#F97316" }], border: [false, false, false, false] },
                                { text: "Abaixo (80-90%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#10B981" }], border: [false, false, false, false] },
                                { text: "Normal (90-110%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#3B82F6" }], border: [false, false, false, false] },
                                { text: "Acima (110-120%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                              [
                                { canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 6, color: "#8B5CF6" }], border: [false, false, false, false] },
                                { text: "Alto (>120%)", fontSize: 5, border: [false, false, false, false] },
                              ],
                            ],
                          },
                          margin: [10, 0, 15, 0],
                        },
                      ],
                    },
                  ],
                },
                
                // Gráficos de Evolução
                ...this.createEvolutionCharts(data.historico || []),
                
                // Rodapé
                {
                  text: `Relatório gerado em ${new Date().toLocaleString("pt-BR")} | Rafael Lara - Endocrinologia - CRM-BA 12345`,
                  fontSize: 5,
                  color: "#999",
                  alignment: "center",
                  margin: [0, 10, 0, 8],
                },
              ],
            },
          ],
        },
      ],
    };

    return pdfMakeInstance.createPdf(docDefinition);
  }

  private static createSidebarField(label: string, value: string, labelSize: number, valueSize: number) {
    return [
      {
        text: label,
        fontSize: labelSize,
        color: "white",
        margin: [10, 0, 10, 1],
      },
      {
        text: value,
        fontSize: valueSize,
        bold: true,
        color: "white",
        margin: [10, 0, 10, 4],
      },
    ];
  }

  private static createMusculoGorduraRow(label: string, value: any, minNormal: number, maxNormal: number, unit: string) {
    const val = parseFloat(value) || 0;
    const totalWidth = 250;
    
    // Calcular larguras das faixas (proporcionalmente)
    const abaixoWidth = minNormal;
    const normalWidth = maxNormal - minNormal;
    const acimaWidth = maxNormal * 0.5; // 50% acima do máximo normal
    
    const total = abaixoWidth + normalWidth + acimaWidth;
    const abaixoPct = (abaixoWidth / total) * 100;
    const normalPct = (normalWidth / total) * 100;
    const acimaPct = (acimaWidth / total) * 100;
    
    // Determinar posição do marcador
    let markerX = 0;
    if (val < minNormal) {
      markerX = (val / minNormal) * (abaixoPct / 100) * totalWidth;
    } else if (val <= maxNormal) {
      markerX = (abaixoPct / 100) * totalWidth + ((val - minNormal) / normalWidth) * (normalPct / 100) * totalWidth;
    } else {
      markerX = ((abaixoPct + normalPct) / 100) * totalWidth + Math.min(((val - maxNormal) / acimaWidth) * (acimaPct / 100) * totalWidth, (acimaPct / 100) * totalWidth);
    }
    
    return [[
      { text: label, fontSize: 6, margin: [0, 3, 0, 3] },
      { text: unit, fontSize: 6, alignment: "center", margin: [0, 3, 0, 3] },
      {
        stack: [
          {
            canvas: [
              // Faixa Abaixo (amarelo)
              { type: "rect", x: 0, y: 0, w: totalWidth * (abaixoPct / 100), h: 12, color: "#FDE68A" },
              // Faixa Normal (verde)
              { type: "rect", x: totalWidth * (abaixoPct / 100), y: 0, w: totalWidth * (normalPct / 100), h: 12, color: "#A7F3D0" },
              // Faixa Acima (vermelho)
              { type: "rect", x: totalWidth * ((abaixoPct + normalPct) / 100), y: 0, w: totalWidth * (acimaPct / 100), h: 12, color: "#FCA5A5" },
              // Marcador de posição
              { type: "rect", x: markerX, y: 0, w: 2, h: 12, color: "#000" },
            ],
            margin: [0, 3, 0, 0],
          },
        ],
        margin: [0, 3, 0, 3],
      },
      { text: `${val} ${unit}`, fontSize: 7, bold: true, alignment: "right", margin: [0, 3, 0, 3] },
    ]];
  }

  private static createEvolutionCharts(historico: Array<{dataAvaliacao: string | Date; resultados: any}>): any[] {
    if (!historico || historico.length < 2) return [];

    try {
      // Ordenar por data e pegar últimas 5
      const sorted = [...historico]
        .sort((a, b) => new Date(a.dataAvaliacao).getTime() - new Date(b.dataAvaliacao).getTime())
        .slice(-5);

      // Criar arrays de dados
      const datas: any[] = [];
      const pesos: any[] = [];
      const gorduras: any[] = [];

      sorted.forEach(h => {
        const data = new Date(h.dataAvaliacao);
        const dataStr = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        
        datas.push({ text: dataStr, fontSize: 5, alignment: "center", border: [false, false, false, true], borderColor: ["#E5E7EB", "#E5E7EB", "#E5E7EB", "#E5E7EB"] });
        pesos.push({ text: `${h.resultados?.peso || "N/A"} kg`, fontSize: 6, bold: true, alignment: "center", color: "#2C5AA0", border: [false, false, false, false] });
        gorduras.push({ text: `${h.resultados?.percentualGorduraCorporal || "N/A"}%`, fontSize: 6, bold: true, alignment: "center", color: "#F59E0B", border: [false, false, false, false] });
      });

      return [
        {
          text: "Evolução Temporal",
          fontSize: 9,
          bold: true,
          color: "#2C5AA0",
          margin: [10, 8, 10, 4],
        },
        {
          columns: [
            {
              width: "48%",
              stack: [
                { text: "Evolução do Peso (kg)", fontSize: 7, bold: true, margin: [0, 0, 0, 3] },
                { table: { widths: Array(sorted.length).fill("*"), body: [datas, pesos] }, margin: [0, 0, 0, 0] },
              ],
            },
            {
              width: "48%",
              stack: [
                { text: "Evolução da Gordura (%)", fontSize: 7, bold: true, margin: [0, 0, 0, 3] },
                { table: { widths: Array(sorted.length).fill("*"), body: [datas, gorduras] }, margin: [0, 0, 0, 0] },
              ],
            },
          ],
          columnGap: 10,
          margin: [10, 0, 10, 8],
        },
      ];
    } catch (error) {
      console.error("Erro ao criar gráficos de evolução:", error);
      return [];
    }
  }

  private static generateGorduraAvatarSVG(r: any): string {
    const getGorduraColor = (taxa: number) => {
      if (taxa < 15) return "#10B981"; // Verde (baixo)
      if (taxa <= 25) return "#F59E0B"; // Laranja (normal)
      return "#EF4444"; // Vermelho (alto)
    };

    const bracoEsqColor = getGorduraColor(parseFloat(r?.taxaGorduraBracoEsq || "20"));
    const bracoDirColor = getGorduraColor(parseFloat(r?.taxaGorduraBracoDir || "20"));
    const pernaEsqColor = getGorduraColor(parseFloat(r?.taxaGorduraPernaEsq || "20"));
    const pernaDirColor = getGorduraColor(parseFloat(r?.taxaGorduraPernaDir || "20"));
    const troncoColor = getGorduraColor(parseFloat(r?.taxaGorduraTronco || "20"));

    return `<svg width="100" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="15" r="10" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1"/>
        <rect x="38" y="25" width="24" height="35" fill="${troncoColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="20" y="28" width="16" height="28" fill="${bracoEsqColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="64" y="28" width="16" height="28" fill="${bracoDirColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="38" y="62" width="10" height="45" fill="${pernaEsqColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="52" y="62" width="10" height="45" fill="${pernaDirColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <text x="28" y="44" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaGorduraBracoEsq || "N/A"}</text>
        <text x="72" y="44" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaGorduraBracoDir || "N/A"}</text>
        <text x="50" y="48" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaGorduraTronco || "N/A"}</text>
        <text x="43" y="88" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaGorduraPernaEsq || "N/A"}</text>
        <text x="57" y="88" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaGorduraPernaDir || "N/A"}</text>
      </svg>`;
  }

  private static generateMusculoAvatarSVG(r: any): string {
    const getMusculoColor = (taxa: number) => {
      if (taxa < 80) return "#EF4444"; // Vermelho
      if (taxa < 90) return "#F97316"; // Laranja
      if (taxa <= 110) return "#10B981"; // Verde
      if (taxa <= 120) return "#3B82F6"; // Azul
      return "#8B5CF6"; // Roxo
    };

    const bracoEsqColor = getMusculoColor(parseFloat(r?.taxaMusculoBracoEsq || "100"));
    const bracoDirColor = getMusculoColor(parseFloat(r?.taxaMusculoBracoDir || "100"));
    const pernaEsqColor = getMusculoColor(parseFloat(r?.taxaMusculoPernaEsq || "100"));
    const pernaDirColor = getMusculoColor(parseFloat(r?.taxaMusculoPernaDir || "100"));
    const troncoColor = getMusculoColor(parseFloat(r?.taxaMusculoTronco || "100"));

    return `<svg width="100" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="15" r="10" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1"/>
        <rect x="38" y="25" width="24" height="35" fill="${troncoColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="20" y="28" width="16" height="28" fill="${bracoEsqColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="64" y="28" width="16" height="28" fill="${bracoDirColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="38" y="62" width="10" height="45" fill="${pernaEsqColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <rect x="52" y="62" width="10" height="45" fill="${pernaDirColor}" stroke="#9CA3AF" stroke-width="1" rx="2"/>
        <text x="28" y="44" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaMusculoBracoEsq || "N/A"}</text>
        <text x="72" y="44" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaMusculoBracoDir || "N/A"}</text>
        <text x="50" y="48" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaMusculoTronco || "N/A"}</text>
        <text x="43" y="88" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaMusculoPernaEsq || "N/A"}</text>
        <text x="57" y="88" font-size="7" fill="white" font-weight="bold" text-anchor="middle">${r?.taxaMusculoPernaDir || "N/A"}</text>
      </svg>`;
  }

  static download(data: BioimpedanciaData) {
    const pdf = this.generate(data);
    const fileName = `bioimpedancia_${data.paciente.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.download(fileName);
  }

  static print(data: BioimpedanciaData) {
    const pdf = this.generate(data);
    pdf.print();
  }
}
