import { SolicitacaoExamesPayload } from "../consultas.types";

function normalizarTexto(valor?: string) {
  return valor?.trim() ? valor.trim() : undefined;
}

export function formatarSolicitacaoExames(payload: SolicitacaoExamesPayload): string {
  const dataSolicitacao = payload.data ?? new Date().toISOString().split("T")[0];
  const cabecalho = [
    "Solicitação de Exames Laboratoriais",
    `Data: ${dataSolicitacao}`,
    payload.paciente?.nome ? `Paciente: ${payload.paciente.nome}` : undefined,
    payload.medico?.nome
      ? `Médico responsável: ${payload.medico.nome}${payload.medico.crm ? ` • CRM ${payload.medico.crm}` : ""}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  const listaExames = payload.itens
    .filter((item) => normalizarTexto(item.nome))
    .map((item, index) => {
      const partes = [
        `${index + 1}. ${item.nome.trim()}`,
        normalizarTexto(item.justificativa) ? `Justificativa: ${item.justificativa!.trim()}` : undefined,
        normalizarTexto(item.orientacoes) ? `Orientações: ${item.orientacoes!.trim()}` : undefined,
      ].filter(Boolean);

      return partes.join("\n");
    })
    .join("\n\n");

  const observacoes = normalizarTexto(payload.observacoes)
    ? `Observações adicionais:\n${payload.observacoes!.trim()}`
    : undefined;

  return [cabecalho, "", "Exames solicitados:", listaExames, observacoes]
    .filter(Boolean)
    .join("\n\n");
}

export function gerarPdfSolicitacaoExames(payload: SolicitacaoExamesPayload) {
  const conteudo = formatarSolicitacaoExames(payload);
  const timestamp = payload.data ?? new Date().toISOString().split("T")[0];
  const pacienteSlug = payload.paciente?.nome?.replace(/\s+/g, "-") ?? "paciente";
  const fileName = `solicitacao-exames-${pacienteSlug}-${timestamp}.pdf`;

  const encoder = new TextEncoder();
  const pdfBuffer = encoder.encode(conteudo);

  return {
    fileName,
    conteudo,
    pdfBuffer,
  };
}
