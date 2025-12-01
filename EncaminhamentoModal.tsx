import { useEffect, useMemo, useState } from "react";
import { EncaminhamentoData, mapEncaminhamentoDados } from "./encaminhamento";

interface EncaminhamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EncaminhamentoData) => Promise<void> | void;
  pacienteNome: string;
  medicoNome?: string;
  medicoCrm?: string;
}

export function EncaminhamentoModal({
  open,
  onClose,
  onSubmit,
  pacienteNome,
  medicoNome,
  medicoCrm,
}: EncaminhamentoModalProps) {
  const [especialidade, setEspecialidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [historico, setHistorico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEspecialidade("");
      setMotivo("");
      setHistorico("");
      setObservacoes("");
      setErro(null);
    }
  }, [open]);

  const payload = useMemo(() =>
    mapEncaminhamentoDados({
      especialidade,
      motivo,
      historico,
      observacoes,
      paciente: { nome: pacienteNome },
      medico: { nome: medicoNome, crm: medicoCrm },
    }),
  [especialidade, motivo, historico, observacoes, pacienteNome, medicoNome, medicoCrm]);

  const handleSubmit = async () => {
    try {
      setErro(null);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar encaminhamento"
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
              Encaminhamento
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Solicitação para outra especialidade
            </h2>
            <p className="text-sm text-slate-600">
              Preencha o motivo do encaminhamento e o histórico clínico relevante.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-sm"
            aria-label="Fechar modal"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Especialidade
            </span>
            <input
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
              placeholder="Ex.: Cardiologia, Nefrologia"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Motivo do encaminhamento
            </span>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Sintomas, achados ou necessidade de co-manejo"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Histórico clínico relevante
          </span>
          <textarea
            value={historico}
            onChange={(e) => setHistorico(e.target.value)}
            rows={4}
            placeholder="Resuma evolução, exames prévios, fatores de risco e tratamentos já realizados"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Observações ao especialista
          </span>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Alertas, restrições ou perguntas específicas"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        {erro ? (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
            {erro}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2C5AA0] hover:bg-[#234a85]"
          >
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
