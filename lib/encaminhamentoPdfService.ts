import { EncaminhamentoData, encaminhamentoSchema } from "../encaminhamento";
import { convertSVGtoPDF } from "../svgProcessor";

const baseStyles = `
  <style>
    :root {
      --primary: #2c5aa0;
      --bg: #f8fafc;
      --text: #0f172a;
      --muted: #475569;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px;
      margin: 0;
    }

    .card {
      background: white;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 18px 60px rgba(15, 23, 42, 0.12);
      border: 1px solid #e2e8f0;
    }

    .title {
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
      margin: 0 0 18px 0;
      font-weight: 800;
    }

    .section {
      margin-top: 12px;
    }

    .section h3 {
      margin: 0 0 6px 0;
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(44, 90, 160, 0.08);
      color: var(--primary);
      font-weight: 700;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .muted {
      color: var(--muted);
      line-height: 1.6;
      font-size: 14px;
      margin: 0;
    }

    .chip {
      display: inline-block;
      padding: 6px 10px;
      background: #f1f5f9;
      color: var(--muted);
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
`;

function renderSection(title: string, content: string) {
  return `
    <div class="section">
      <h3>${title}</h3>
      <p class="muted">${content}</p>
    </div>
  `;
}

export function renderEncaminhamentoHtml(data: EncaminhamentoData): string {
  const parsed = encaminhamentoSchema.parse(data);

  const pacienteLinha = [
    parsed.paciente.nome,
    parsed.paciente.idade ? `${parsed.paciente.idade} anos` : null,
    parsed.paciente.sexo,
  ]
    .filter(Boolean)
    .join(" · ");

  const medicoLinha = parsed.medico
    ? [
        parsed.medico.nome,
        parsed.medico.crm ? `CRM ${parsed.medico.crm}` : null,
        parsed.medico.especialidade,
      ]
        .filter(Boolean)
        .join(" · ") || "Médico não informado"
    : "Médico não informado";

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        ${baseStyles}
      </head>
      <body>
        <div class="card">
          <p class="title">Encaminhamento médico</p>
          <div class="grid">
            <div class="section">
              <h3>Paciente</h3>
              <p class="muted">${pacienteLinha}</p>
            </div>
            <div class="section" style="text-align: right;">
              <h3>Solicitante</h3>
              <span class="chip">${medicoLinha}</span>
            </div>
          </div>

          <div class="section">
            <h3>Especialidade</h3>
            <span class="pill">${parsed.especialidade}</span>
          </div>

          ${renderSection("Motivo do encaminhamento", parsed.motivo)}
          ${renderSection("Histórico clínico relevante", parsed.historicoClinico)}
          ${
            parsed.observacoes
              ? renderSection("Observações adicionais", parsed.observacoes)
              : ""
          }
        </div>
      </body>
    </html>
  `;
}

export async function generateEncaminhamentoPdf(
  data: EncaminhamentoData
): Promise<Buffer> {
  const html = renderEncaminhamentoHtml(data);
  return convertSVGtoPDF(html);
}
