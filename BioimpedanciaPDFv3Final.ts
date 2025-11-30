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