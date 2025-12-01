import { laudoSchema, type Laudo } from "../laudoSchema";
import { convertSVGtoPDF } from "../svgProcessor";
import { storagePut } from "../storage";

export function renderLaudoHTML(laudo: Laudo): string {
  const achadosHtml = laudo.achados
    .map(
      (achado, index) => `
      <div class="achado">
        <div class="achado-titulo">${index + 1}. ${achado.titulo}</div>
        <div class="achado-descricao">${achado.descricao}</div>
      </div>
    `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <style>
        @page { size: A4; margin: 32px; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; }
        h1 { color: #1f2937; margin-bottom: 4px; }
        .meta { color: #4b5563; font-size: 12px; margin-bottom: 16px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #111827; }
        .achado { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; }
        .achado-titulo { font-weight: 600; color: #111827; margin-bottom: 4px; }
        .achado-descricao { color: #374151; white-space: pre-wrap; }
        .conclusao { background: #eff6ff; border-left: 4px solid #1d4ed8; padding: 12px; border-radius: 6px; color: #1e3a8a; white-space: pre-wrap; }
        .carimbo { border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 20px; font-size: 14px; color: #111827; }
        .assinatura { font-weight: 600; }
        .observacoes { color: #374151; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <header>
        <h1>Laudo Clínico</h1>
        <div class="meta">
          <div><strong>Paciente:</strong> ${laudo.paciente.nome}</div>
          <div><strong>Documento:</strong> ${laudo.paciente.documento ?? "-"}</div>
          <div><strong>Data:</strong> ${laudo.dataEmissao}</div>
        </div>
      </header>

      <section class="section">
        <div class="section-title">Achados</div>
        ${achadosHtml}
      </section>

      <section class="section">
        <div class="section-title">Conclusão</div>
        <div class="conclusao">${laudo.conclusao}</div>
      </section>

      ${laudo.observacoes ? `<section class="section">
        <div class="section-title">Observações</div>
        <div class="observacoes">${laudo.observacoes}</div>
      </section>` : ""}

      <section class="section carimbo">
        <div><strong>Responsável:</strong> ${laudo.carimbo.profissional}</div>
        <div><strong>Registro:</strong> ${laudo.carimbo.registro}</div>
        <div class="assinatura">${laudo.carimbo.assinaturaDigital}</div>
      </section>
    </body>
  </html>
  `;
}

export async function generateLaudoPDF(laudo: Laudo): Promise<{
  pdfUrl: string;
  pdfPath: string;
  html: string;
}> {
  const parsed = laudoSchema.parse(laudo);

  const htmlContent = renderLaudoHTML(parsed);
  const pdfBuffer = await convertSVGtoPDF(htmlContent);
  const timestamp = Date.now();
  const fileName = `laudo-${parsed.paciente.id}-${timestamp}.pdf`;
  const fileKey = `documentos/${parsed.paciente.id}/${fileName}`;

  const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return {
    pdfUrl,
    pdfPath: fileKey,
    html: htmlContent,
  };
}
