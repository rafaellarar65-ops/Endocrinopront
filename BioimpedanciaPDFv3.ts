                },
                
                // Índices
                {
                  table: {
                    widths: ["50%", "50%"],
                    body: [
                      [
                        { text: "IMC", fontSize: 7, color: "white", fillColor: "#2C5AA0", border: [false, false, false, false], padding: [5, 3, 0, 3] },
                        { text: r?.imc || "N/A", fontSize: 8, bold: true, color: "white", fillColor: "#2C5AA0", alignment: "right", border: [false, false, false, false], padding: [0, 3, 5, 3] },
                      ],
                      [
                        { text: "PGC", fontSize: 7, color: "white", fillColor: "#2C5AA0", border: [false, false, false, false], padding: [5, 3, 0, 3] },
                        { text: `${r?.percentualGordura || "N/A"}%`, fontSize: 8, bold: true, color: "white", fillColor: "#2C5AA0", alignment: "right", border: [false, false, false, false], padding: [0, 3, 5, 3] },
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
                  fontSize: 18,
                  bold: true,
                  color: "#2C5AA0",
                  alignment: "center",
                  margin: [0, 15, 0, 15],
                },
                
                // Composição Corporal
                {
                  text: "COMPOSIÇÃO CORPORAL",
                  fontSize: 9,
                  bold: true,
                  color: "#666",
                  margin: [15, 0, 15, 8],
                },
                
                {
                  table: {
                    widths: ["30%", "15%", "40%", "15%"],
                    body: [
                      ...this.createCompositionRow("Água Corporal", r?.aguaCorporal, r?.percentualAgua, "L"),
                      ...this.createCompositionRow("Proteína", r?.proteina, r?.percentualProteina, "kg"),
                      ...this.createCompositionRow("Minerais", r?.salInorganico, r?.percentualMinerais, "kg"),
                      ...this.createCompositionRow("Gordura Corporal", r?.massaGorda, r?.percentualGordura, "kg"),
                    ],
                  },
                  margin: [15, 0, 15, 15],
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0,
                    hLineColor: () => "#E5E7EB",
                  },
                },
                
                // Análise Músculo-Gordura
                {
                  text: "ANÁLISE MÚSCULO-GORDURA",
                  fontSize: 9,
                  bold: true,
                  color: "#666",
                  margin: [15, 5, 15, 8],
                },
                
                {
                  columns: [
                    {
                      width: "50%",
                      stack: [
                        {
                          text: "Peso (kg)",
                          fontSize: 8,
                          bold: true,
                          margin: [15, 0, 0, 5],
                        },
                        {
                          canvas: [
                            { type: "line", x1: 15, y1: 10, x2: 200, y2: 10, lineWidth: 2, lineColor: "#E5E7EB" },
                            { type: "rect", x: this.calculateMarkerPosition(parseFloat(r?.peso || "0"), 40, 100, 185), y: 5, w: 2, h: 10, color: "#000" },
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
                          fontSize: 8,
                          bold: true,
                          margin: [15, 0, 0, 5],
                        },
                        {
                          canvas: [
                            { type: "line", x1: 15, y1: 10, x2: 200, y2: 10, lineWidth: 2, lineColor: "#E5E7EB" },
                            { type: "rect", x: this.calculateMarkerPosition(parseFloat(r?.massaMuscular || "0"), 20, 60, 185), y: 5, w: 2, h: 10, color: "#000" },
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
                  margin: [0, 0, 0, 15],
                },
                
                // Análise Segmentar
                {
                  text: "ANÁLISE SEGMENTAR - MASSA MUSCULAR",
                  fontSize: 9,
                  bold: true,
                  color: "white",
                  fillColor: "#2C5AA0",
                  margin: [15, 5, 15, 0],
                  alignment: "center",
                  padding: [0, 5, 0, 5],
                },
                
                {
                  columns: [
                    // Tabela de valores
                    {
                      width: "60%",
                      table: {
                        widths: ["35%", "32.5%", "32.5%"],
                        body: [
                          [
                            { text: "Segmento", fontSize: 8, bold: true, fillColor: "#F3F4F6" },
                            { text: "Massa (kg)", fontSize: 8, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                            { text: "Taxa (%)", fontSize: 8, bold: true, fillColor: "#F3F4F6", alignment: "center" },
                          ],
                          [
                            { text: "Braço Esq.", fontSize: 7 },
                            { text: r?.musculoBracoEsq || "N/A", fontSize: 7, alignment: "center" },
                            { text: r?.taxaMusculoBracoEsq || "N/A", fontSize: 7, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Braço Dir.", fontSize: 7 },
                            { text: r?.musculoBracoDir || "N/A", fontSize: 7, alignment: "center" },
                            { text: r?.taxaMusculoBracoDir || "N/A", fontSize: 7, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Esq.", fontSize: 7 },
                            { text: r?.musculoPernaEsq || "N/A", fontSize: 7, alignment: "center" },
                            { text: r?.taxaMusculoPernaEsq || "N/A", fontSize: 7, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Perna Dir.", fontSize: 7 },
                            { text: r?.musculoPernaDir || "N/A", fontSize: 7, alignment: "center" },
                            { text: r?.taxaMusculoPernaDir || "N/A", fontSize: 7, alignment: "center", bold: true },
                          ],
                          [
                            { text: "Tronco", fontSize: 7 },
                            { text: r?.musculoTronco || "N/A", fontSize: 7, alignment: "center" },
                            { text: r?.taxaMusculoTronco || "N/A", fontSize: 7, alignment: "center", bold: true },
                          ],
                        ],
                      },
                      margin: [15, 0, 10, 0],
                    },
                    // Avatar SVG
                    {
                      width: "40%",
                      svg: this.generateAvatarSVG(r),
                      margin: [0, 10, 15, 0],
                    },
                  ],
                },
                
                // Rodapé
                {
                  text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
                  fontSize: 7,
                  color: "#999",
                  alignment: "center",
                  margin: [0, 20, 0, 10],
                },
              ],
            },