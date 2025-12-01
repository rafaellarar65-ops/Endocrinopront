import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  SolicitacaoExameItem,
  SolicitacaoExamesPayload,
} from "./consultas.types";
import {
  formatarSolicitacaoExames,
  gerarPdfSolicitacaoExames,
} from "./lib/solicitacaoExamesPdfService";

interface SolicitacaoExamesModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate?: (
    resultado: ReturnType<typeof gerarPdfSolicitacaoExames>,
    payload: SolicitacaoExamesPayload
  ) => void;
  pacienteNome?: string;
  medicoNome?: string;
  consultaId?: number;
}

export function SolicitacaoExamesModal({
  open,
  onClose,
  onGenerate,
  pacienteNome,
  medicoNome,
  consultaId,
}: SolicitacaoExamesModalProps) {
  const [itens, setItens] = useState<SolicitacaoExameItem[]>([
    { nome: "", justificativa: "", orientacoes: "" },
  ]);
  const [observacoes, setObservacoes] = useState("");
  const [medico, setMedico] = useState(medicoNome ?? "");
  const [paciente, setPaciente] = useState(pacienteNome ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErro(null);
    }
  }, [open]);

  useEffect(() => () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  }, [downloadUrl]);

  const possuiItemValido = useMemo(
    () => itens.some((item) => item.nome.trim().length > 0),
    [itens]
  );

  const handleAdicionarItem = () => {
    setItens([...itens, { nome: "", justificativa: "", orientacoes: "" }]);
  };

  const handleRemoverItem = (index: number) => {
    if (itens.length === 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    campo: keyof SolicitacaoExameItem,
    valor: string
  ) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setItens(novosItens);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!possuiItemValido) {
      setErro("Inclua ao menos um exame na solicitação.");
      return;
    }

    const payload: SolicitacaoExamesPayload = {
      consultaId,
      paciente: { nome: paciente },
      medico: { nome: medico },
      data: new Date().toISOString().split("T")[0],
      itens,
      observacoes,
    };

    const resultado = gerarPdfSolicitacaoExames(payload);
    setPreview(formatarSolicitacaoExames(payload));

    const blob = new Blob([resultado.pdfBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);

    onGenerate?.(resultado, payload);
    setErro(null);
  };

  const handleFechar = () => {
    setItens([{ nome: "", justificativa: "", orientacoes: "" }]);
    setObservacoes("");
    setMedico(medicoNome ?? "");
    setPaciente(pacienteNome ?? "");
    setPreview(null);
    setDownloadUrl(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Solicitação de exames</h2>
            <p className="text-sm text-gray-600">
              Estruture os exames desejados e gere um PDF alinhado ao padrão da
              consulta.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-sm font-medium text-gray-700">
              Paciente
              <input
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Nome do paciente"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-gray-700">
              Médico responsável
              <input
                value={medico}
                onChange={(e) => setMedico(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Nome do médico"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Exames solicitados</span>
              <button
                type="button"
                onClick={handleAdicionarItem}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + Adicionar exame
              </button>
            </div>

            <div className="space-y-3">
              {itens.map((item, index) => (
                <div
                  key={`exame-${index}`}
                  className="rounded-lg border border-gray-200 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Exame
                        <input
                          value={item.nome}
                          onChange={(e) =>
                            handleItemChange(index, "nome", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Hemograma, TSH, perfil lipídico..."
                          required={!possuiItemValido}
                        />
                      </label>

                      <label className="block text-sm text-gray-700">
                        Justificativa (opcional)
                        <textarea
                          value={item.justificativa ?? ""}
                          onChange={(e) =>
                            handleItemChange(index, "justificativa", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </label>

                      <label className="block text-sm text-gray-700">
                        Orientações ao laboratório (opcional)
                        <textarea
                          value={item.orientacoes ?? ""}
                          onChange={(e) =>
                            handleItemChange(index, "orientacoes", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverItem(index)}
                      className="mt-1 text-sm text-red-600 hover:text-red-700"
                      aria-label="Remover exame"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="block space-y-1 text-sm text-gray-700">
            Observações gerais (opcional)
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Jejum obrigatório, suspender biotina por 3 dias, etc."
            />
          </label>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleFechar}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Gerar PDF
            </button>
          </div>
        </form>

        {(preview || downloadUrl) && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Pré-visualização</h3>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Baixar PDF
                </a>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{preview}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
