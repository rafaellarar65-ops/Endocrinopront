import type React from "react";
import { useState } from "react";
import type { DeclaracaoMedicaEssenciais } from "./declaracaoMedica.types";
import {
  gerarDeclaracaoMedicaPdf,
  type DeclaracaoMedicaPayload,
} from "./lib/declaracaoMedicaPdfService";

type Props = {
  open: boolean;
  onClose: () => void;
  pacienteNome: string;
  medicoNome: string;
  crm: string;
  onGenerate?: (result: Awaited<ReturnType<typeof gerarDeclaracaoMedicaPdf>>) => void;
};

const emptyEssenciais: DeclaracaoMedicaEssenciais = {
  finalidade: "",
  periodo: {
    inicio: "",
    fim: "",
  },
  assinatura: "digital",
};

export function DeclaracaoMedicaModal({
  open,
  onClose,
  pacienteNome,
  medicoNome,
  crm,
  onGenerate,
}: Props) {
  const [essenciais, setEssenciais] = useState<DeclaracaoMedicaEssenciais>(emptyEssenciais);
  const [observacoes, setObservacoes] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = <K extends keyof DeclaracaoMedicaEssenciais>(
    key: K,
    value: DeclaracaoMedicaEssenciais[K]
  ) => {
    setEssenciais((current) => ({ ...current, [key]: value }));
  };

  const handlePeriodoChange = (key: keyof DeclaracaoMedicaEssenciais["periodo"], value: string) => {
    setEssenciais((current) => ({
      ...current,
      periodo: {
        ...current.periodo,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro(null);
    setLoading(true);

    const payload: DeclaracaoMedicaPayload = {
      pacienteNome,
      medicoNome,
      crm,
      dataEmissao,
      observacoes: observacoes.trim() || undefined,
      essenciais,
    };

    try {
      const result = await gerarDeclaracaoMedicaPdf(payload);
      onGenerate?.(result);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível gerar o PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Nova declaração médica</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">×</button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>Finalidade *</span>
            <input
              type="text"
              value={essenciais.finalidade}
              onChange={(e) => handleChange("finalidade", e.target.value)}
              required
            />
          </label>

          <div className="field-group">
            <label className="field">
              <span>Início do período *</span>
              <input
                type="date"
                value={essenciais.periodo.inicio}
                onChange={(e) => handlePeriodoChange("inicio", e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Fim do período *</span>
              <input
                type="date"
                value={essenciais.periodo.fim}
                onChange={(e) => handlePeriodoChange("fim", e.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Tipo de assinatura *</span>
            <select
              value={essenciais.assinatura}
              onChange={(e) => handleChange("assinatura", e.target.value as DeclaracaoMedicaEssenciais["assinatura"])}
            >
              <option value="digital">Digital</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label className="field">
            <span>Data de emissão *</span>
            <input
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Observações (opcional)</span>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </label>

          {erro && <p className="erro" role="alert">{erro}</p>}

          <footer className="modal-footer">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Gerando..." : "Gerar PDF"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
