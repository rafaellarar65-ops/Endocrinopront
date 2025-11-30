/**
 * Script de teste para geração de receituário em PDF
 */

import { fillReceituarioSVG, convertSVGtoPDF, type ReceituarioData } from "./server/services/svgProcessor";
import { writeFile } from "fs/promises";

async function testReceituario() {
  console.log("🧪 Testando geração de receituário...");

  const dadosTeste: ReceituarioData = {
    nomePaciente: "Maria Silva Santos",
    data: new Date().toLocaleDateString("pt-BR"),
    medicamentos: [
      {
        nome: "Metformina 850mg",
        dosagem: "850mg",
        via: "Oral",
        posologia: "1 comprimido 2x ao dia (café da manhã e jantar)",
        duracao: "Uso contínuo",
      },
      {
        nome: "Levotiroxina Sódica 50mcg",
        dosagem: "50mcg",
        via: "Oral",
        posologia: "1 comprimido em jejum, 30 minutos antes do café",
        duracao: "Uso contínuo",
      },
    ],
    instrucoesAdicionais:
      "Manter dieta equilibrada e praticar atividade física regular. Retornar em 3 meses com exames de glicemia, HbA1c e TSH.",
  };

  try {
    // Gerar HTML com SVG como background
    console.log("📝 Gerando HTML...");
    const html = await fillReceituarioSVG(dadosTeste);

    // Salvar HTML para inspeção
    await writeFile("./receituario_teste.html", html);
    console.log("✅ HTML salvo em: receituario_teste.html");

    // Converter para PDF
    console.log("📄 Convertendo para PDF...");
    const pdfBuffer = await convertSVGtoPDF(html);

    // Salvar PDF
    await writeFile("./receituario_teste.pdf", pdfBuffer);
    console.log("✅ PDF gerado com sucesso: receituario_teste.pdf");

    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Tamanho do HTML: ${(html.length / 1024).toFixed(2)} KB`);
    console.log(`   - Tamanho do PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   - Medicamentos: ${dadosTeste.medicamentos.length}`);
  } catch (error) {
    console.error("❌ Erro ao gerar receituário:", error);
    process.exit(1);
  }
}

testReceituario();
