import React, { useState } from "react";
import AppLayout from "./AppLayout";
import { trpc } from "./lib/trpc";
import { useToast } from "./use-toast";

export default function EscoresPage() {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [parametros, setParametros] = useState("");

  const { data: modulos, refetch } = trpc.escores.listarModulos.useQuery?.() ?? { data: null, refetch: () => {} };

  const solicitarModulo = trpc.escores.solicitarModuloIA.useMutation?.({
    onSuccess: () => {
      toast({ title: "Módulo enviado", description: "O novo escore foi incorporado ao catálogo." });
      refetch?.();
      setNome("");
      setDescricao("");
      setParametros("");
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível solicitar o módulo agora." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    solicitarModulo?.mutateAsync?.({
      nome,
      descricao,
      parametrosNecessarios: parametros
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    });
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">Escores Clínicos Automatizados</h1>
          <p className="text-sm text-gray-600">
            Calcule escores padrão (FINDRISC, Framingham, HOMA-IR, TyG, TFG) e solicite novos módulos via IA.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Adicionar novo módulo (IA mestre)</h2>
            <span className="text-xs text-gray-500">Menu &gt; Escores &gt; Adicionar módulo</span>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do escore</label>
              <input
                className="w-full mt-1 rounded border border-gray-200 p-2"
                placeholder="Ex.: Escore personalizado de risco"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Descrição / contexto clínico</label>
              <textarea
                className="w-full mt-1 rounded border border-gray-200 p-2"
                placeholder="Explique para que serve, público-alvo, quando calcular"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Parâmetros necessários (separados por vírgula)</label>
              <input
                className="w-full mt-1 rounded border border-gray-200 p-2"
                placeholder="glicemia, pressão sistólica, LDL, peso, altura"
                value={parametros}
                onChange={(e) => setParametros(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-[#2C5AA0] text-white px-4 py-2 rounded disabled:opacity-60"
              disabled={!nome || solicitarModulo?.isLoading}
            >
              {solicitarModulo?.isLoading ? "Enviando..." : "Enviar à IA mestre"}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Catálogo de escores disponíveis</h2>
          <p className="text-sm text-gray-600 mb-4">
            Inclui escores padrão e módulos criados via IA. Use-os para cálculo automático dentro das consultas.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {modulos?.base?.map((esc: any) => (
              <div key={esc.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                <p className="text-sm font-semibold">{esc.nome}</p>
                <p className="text-xs text-gray-600">{esc.descricao}</p>
                <p className="text-[11px] text-gray-500 mt-1">Categoria: {esc.categoria}</p>
              </div>
            ))}
            {modulos?.custom?.map((esc: any) => (
              <div key={`custom-${esc.id}`} className="border border-blue-200 rounded p-3 bg-blue-50">
                <p className="text-sm font-semibold">{esc.nome}</p>
                <p className="text-xs text-gray-700">{esc.descricao}</p>
                {esc.referencia && <p className="text-[11px] text-gray-500 mt-1">Ref.: {esc.referencia}</p>}
                {Array.isArray(esc.parametrosNecessarios) && esc.parametrosNecessarios.length > 0 && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    Parâmetros: {esc.parametrosNecessarios.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
