/**
 * Serviço para processar templates SVG e preencher com dados dinâmicos
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export interface ReceituarioData {
  nomePaciente: string;
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

export interface BioimpedanciaData {
  nome: string;
  nascimento: string;
  idade: number;
  genero: string;
  dataExame: string;
  horaExame: string;
  peso: number;
  altura: number;
  imc: number;
  // Composição corporal
  aguaCorporal: number;
  proteinas: number;
  minerais: number;
  gorduraCorporal: number;
  massaMagra: number;
  // Avaliação nutricional
  protein: string;
  mineral: string;
  fat: string;
  // Controle de peso
  weightControl: number;
  fatControl: number;
  muscleControl: number;
  // Dados adicionais
  smm: number;
  bmi: number;
  pbf: number;
  whr: number;
}

/**
 * Gera HTML com SVG como background e texto sobreposto
 */
export async function fillReceituarioSVG(data: ReceituarioData): Promise<string> {
  const templatePath = join(process.cwd(), "templates", "Receituario2.svg");
  const svgBackground = await readFile(templatePath, "utf-8");

  const assinaturaLabel =
    data.assinaturaTipo === "manual"
      ? "Assinatura manual (imprimir e assinar)"
      : "Assinatura digital (arquivo já sai assinado)";

  // Criar HTML com SVG como background e texto sobreposto
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    body { 
      margin: 0; 
      padding: 0; 
      width: 210mm; 
      height: 297mm;
      position: relative;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    .content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      padding: 280px 60px 100px 60px;
    }
    .patient-info {
      margin-bottom: 20px;
      font-size: 14px;
      color: #374151;
    }
    .patient-info strong {
      color: #2C5AA0;
    }
    .prescription-title {
      font-size: 18px;
      font-weight: 600;
      color: #2C5AA0;
      margin-bottom: 20px;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 10px;
    }
    .signature-info {
      font-size: 13px;
      color: #4B5563;
      margin-bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(44, 90, 160, 0.05);
      padding: 8px 10px;
      border-radius: 6px;
      border-left: 3px solid #2C5AA0;
    }
    .medication-item {
      margin-bottom: 25px;
      padding: 15px;
      background: rgba(249, 250, 251, 0.95);
      border-left: 4px solid #2C5AA0;
      border-radius: 4px;
    }
    .medication-name {
      font-size: 16px;
      font-weight: 700;
      color: #1F2937;
      margin-bottom: 8px;
    }
    .medication-details {
      font-size: 14px;
      color: #4B5563;
      line-height: 1.8;
    }
    .instructions {
      margin-top: 30px;
      padding: 15px;
      background: rgba(254, 243, 199, 0.95);
      border-left: 4px solid #F59E0B;
      border-radius: 4px;
    }
    .instructions-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400E;
      margin-bottom: 8px;
    }
    .instructions-text {
      font-size: 13px;
      color: #78350F;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="background">
    ${svgBackground}
  </div>
  <div class="content">
    <div class="patient-info">
      <div><strong>Paciente:</strong> ${escapeHTML(data.nomePaciente)}</div>
      <div><strong>Data:</strong> ${escapeHTML(data.data)}</div>
    </div>

    <div class="signature-info">
      <strong>Assinatura:</strong> ${escapeHTML(assinaturaLabel)}
    </div>

    <div class="prescription-title">Prescrição Médica</div>
    
    ${data.medicamentos.map((med, index) => `
      <div class="medication-item">
        <div class="medication-name">${index + 1}. ${escapeHTML(med.nome)}</div>
        <div class="medication-details">
          <div><strong>Dosagem:</strong> ${escapeHTML(med.dosagem)}</div>
          <div><strong>Via:</strong> ${escapeHTML(med.via)}</div>
          <div><strong>Posologia:</strong> ${escapeHTML(med.posologia)}</div>
          <div><strong>Duração:</strong> ${escapeHTML(med.duracao)}</div>
        </div>
      </div>
    `).join('')}
    
    ${data.instrucoesAdicionais ? `
      <div class="instructions">
        <div class="instructions-title">⚠️ Instruções Importantes</div>
        <div class="instructions-text">${escapeHTML(data.instrucoesAdicionais)}</div>
      </div>
    ` : ''}
  </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Preenche template SVG de bioimpedância com dados do exame
 */
export async function fillBioimpedanciaSVG(data: BioimpedanciaData): Promise<string> {
  const templatePath = join(process.cwd(), "templates", "AnáliseCorporal.svg");
  let svgContent = await readFile(templatePath, "utf-8");

  // Substituir placeholders no SVG
  // Nota: O SVG original tem campos de texto que precisam ser identificados e substituídos
  
  // Informações do paciente (lado esquerdo superior)
  svgContent = svgContent.replace(/Nome\s*$/m, `Nome: ${data.nome}`);
  svgContent = svgContent.replace(/Nascimento\s*$/m, `Nascimento: ${data.nascimento}`);
  svgContent = svgContent.replace(/Idade\s*$/m, `Idade: ${data.idade}`);
  svgContent = svgContent.replace(/Genero\s*$/m, `Gênero: ${data.genero}`);
  svgContent = svgContent.replace(/Data exame\s*$/m, `Data exame: ${data.dataExame}`);
  svgContent = svgContent.replace(/Hora exame\s*$/m, `Hora exame: ${data.horaExame}`);

  // Composição corporal
  svgContent = replaceNumberInSVG(svgContent, "agua_corporal", data.aguaCorporal);
  svgContent = replaceNumberInSVG(svgContent, "proteinas", data.proteinas);
  svgContent = replaceNumberInSVG(svgContent, "minerais", data.minerais);
  svgContent = replaceNumberInSVG(svgContent, "gordura_corporal", data.gorduraCorporal);
  svgContent = replaceNumberInSVG(svgContent, "massa_magra", data.massaMagra);

  // Controle de peso
  svgContent = replaceNumberInSVG(svgContent, "weight_control", data.weightControl);
  svgContent = replaceNumberInSVG(svgContent, "fat_control", data.fatControl);
  svgContent = replaceNumberInSVG(svgContent, "muscle_control", data.muscleControl);

  // Índices
  svgContent = replaceNumberInSVG(svgContent, "smm_value", data.smm);
  svgContent = replaceNumberInSVG(svgContent, "bmi_value", data.bmi);
  svgContent = replaceNumberInSVG(svgContent, "pbf_value", data.pbf);
  svgContent = replaceNumberInSVG(svgContent, "whr_value", data.whr);

  return svgContent;
}

/**
 * Adiciona elemento de texto ao SVG
 */
function addTextToSVG(
  svgContent: string,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    fontWeight?: string;
    fill?: string;
    fontFamily?: string;
  } = {}
): string {
  const {
    fontSize = 14,
    fontWeight = "normal",
    fill = "#374151",
    fontFamily = "Segoe UI, Arial, sans-serif",
  } = options;

  const textElement = `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" font-family="${fontFamily}">${escapeXML(text)}</text>`;

  // Inserir antes do fechamento do SVG
  return svgContent.replace("</svg>", `${textElement}\n</svg>`);
}

/**
 * Substitui valor numérico no SVG (busca por padrão de ID ou classe)
 */
function replaceNumberInSVG(
  svgContent: string,
  identifier: string,
  value: number
): string {
  // Tentar diferentes padrões de substituição
  const patterns = [
    new RegExp(`id="${identifier}"[^>]*>([0-9.]+)<`, "g"),
    new RegExp(`class="${identifier}"[^>]*>([0-9.]+)<`, "g"),
    new RegExp(`${identifier}\\s*:\\s*([0-9.]+)`, "g"),
  ];

  let result = svgContent;
  patterns.forEach((pattern) => {
    result = result.replace(pattern, (match) => {
      return match.replace(/([0-9.]+)/, value.toFixed(1));
    });
  });

  return result;
}

/**
 * Escapa caracteres especiais HTML
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapa caracteres especiais XML
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Converte HTML (com SVG embutido) para PDF usando Puppeteer
 */
export async function convertSVGtoPDF(htmlContent: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
