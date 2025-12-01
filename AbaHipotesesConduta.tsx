import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";

interface AbaSeguimentoProps {
  consultaId: number;
  readOnly?: boolean;
}

type FerramentaMEV = {
  nome: string;
  aplicacao: string;
  acordada: boolean;
};

export function AbaHipotesesConduta({
  consultaId,
  readOnly,
}: AbaSeguimentoProps) {
  const { data: consulta, refetch: refetchConsulta } =
    trpc.consultas.getById.useQuery({ id: consultaId });

  const updateMutation =
    trpc.consultas.updateHipotesesConduta.useMutation({
      onSuccess: async () => {
        toast.success("Hipóteses e conduta salvas com sucesso!");
        setHasUnsavedChanges(false);
        await refetchConsulta();
      },
      onError: () => {
        toast.error("Erro ao salvar hipóteses e conduta");
      },
    });

  const iaMutation =
    trpc.consultas.atualizarHipotesesCondutaIA.useMutation({
      onSuccess: async (data) => {
        toast.success(
          "Hipóteses e conduta atualizadas com IA. Revise antes de salvar."
        );
        // Atualiza os campos locais com a sugestão da IA
        if (data.hipotesesDiagnosticas) setHipoteses(data.hipotesesDiagnosticas);
        if (data.conduta) setPlanoTerapeutico(data.conduta);
        if (data.observacoes) setOrientacoes(data.observacoes);
        setHasUnsavedChanges(true);
      },
      onError: () => {
        toast.error("Erro ao atualizar com IA");
      },
    });

  const [hipoteses, setHipoteses] = useState("");
  const [conduta, setConduta] = useState("");
  const [tratamento, setTratamento] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [ferramentasMev, setFerramentasMev] = useState<FerramentaMEV[]>([
    { nome: "", aplicacao: "", acordada: false },
  ]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carrega valores iniciais
  useEffect(() => {
    if (!consulta) return;

    setHipoteses(consulta.hipotesesDiagnosticas ?? "");
    setConduta(consulta.conduta ?? "");

    // Observações agora podem ser JSON com campos adicionais
    const observacoesRaw = consulta.observacoes ?? "";
    try {
      const parsed = typeof observacoesRaw === "string"
        ? JSON.parse(observacoesRaw)
        : observacoesRaw;

      setOrientacoes(parsed?.orientacoes ?? (typeof observacoesRaw === "string" ? observacoesRaw : ""));
      setTratamento(parsed?.tratamento ?? "");
      setFerramentasMev(parsed?.ferramentasMev ?? [{ nome: "", aplicacao: "", acordada: false }]);
    } catch {
      setOrientacoes(typeof observacoesRaw === "string" ? observacoesRaw : "");
      setTratamento("");
      setFerramentasMev([{ nome: "", aplicacao: "", acordada: false }]);
    }

    setHasUnsavedChanges(false);
  }, [consulta]);

  const handleSalvar = async () => {
    if (!consulta) return;
    try {
      const observacoesPayload = {
        orientacoes,
        tratamento,
        ferramentasMev,
      };

      await updateMutation.mutateAsync({
        consultaId: consulta.id,
        hipotesesDiagnosticas: hipoteses || null,
        conduta: conduta || null,
        observacoes: JSON.stringify(observacoesPayload),
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleAtualizarComIA = async () => {
    if (!consulta) return;
    try {
      await iaMutation.mutateAsync({ consultaId: consulta.id });
    } catch (error) {
      console.error("Erro ao atualizar com IA:", error);
    }
  };

  if (!consulta) {
    return (
      <div className="text-center py-12 text-gray-500">
        Consulta não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Seguimento e plano terapêutico
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAtualizarComIA}
            disabled={iaMutation.isPending || readOnly}
          >
            {iaMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Atualizar com IA
              </>
            )}
          </Button>

          <Button
            onClick={handleSalvar}
            disabled={!hasUnsavedChanges || updateMutation.isPending || readOnly}
            variant={hasUnsavedChanges ? "default" : "outline"}
            className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? "Salvar Alterações" : "Salvar"}
              </>
            )}
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          <strong>Alterações não salvas.</strong> Clique em "Salvar Alterações" para persistir os dados.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hipóteses diagnósticas</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="hipoteses" className="mb-2 block">
            Descreva as hipóteses diagnósticas principais e diferenciais
          </Label>
          <Textarea
            id="hipoteses"
            value={hipoteses}
            onChange={(e) => {
              setHipoteses(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={6}
            placeholder={`Exemplo:
1) Diabetes mellitus tipo 2 mal controlado, com provável resistência insulínica importante.
2) Obesidade grau I com fenótipo andróide.
3) Hipotireoidismo subclínico a esclarecer.

Justificativa breve de cada hipótese, quando pertinente.`}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ferramentas de MEV selecionadas e aplicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ferramentasMev.map((mev, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border rounded-lg p-3">
              <div className="space-y-2">
                <Label>Ferramenta</Label>
                <Input
                  placeholder="Ex: MEDAS-14, IPAQ, PSQI"
                  value={mev.nome}
                  onChange={(e) => {
                    const clone = [...ferramentasMev];
                    clone[idx] = { ...clone[idx], nome: e.target.value };
                    setFerramentasMev(clone);
                    setHasUnsavedChanges(true);
                  }}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Como aplicar / orientações práticas</Label>
                <Textarea
                  rows={3}
                  placeholder="Orientações sugeridas pela IA sobre aplicação, frequência, metas e como registrar adesão"
                  value={mev.aplicacao}
                  onChange={(e) => {
                    const clone = [...ferramentasMev];
                    clone[idx] = { ...clone[idx], aplicacao: e.target.value };
                    setFerramentasMev(clone);
                    setHasUnsavedChanges(true);
                  }}
                  disabled={readOnly}
                />
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={mev.acordada}
                    onChange={(e) => {
                      const clone = [...ferramentasMev];
                      clone[idx] = { ...clone[idx], acordada: e.target.checked };
                      setFerramentasMev(clone);
                      setHasUnsavedChanges(true);
                    }}
                    disabled={readOnly}
                  />
                  <span>Ferramenta acordada com o paciente (incluir no PTS e orientações de seguimento)</span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFerramentasMev((prev) => [...prev, { nome: "", aplicacao: "", acordada: false }]);
                setHasUnsavedChanges(true);
              }}
              disabled={readOnly}
            >
              + Adicionar ferramenta
            </Button>
            {ferramentasMev.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFerramentasMev((prev) => prev.slice(0, -1));
                  setHasUnsavedChanges(true);
                }}
                disabled={readOnly}
              >
                Remover última
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conduta</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="conduta" className="mb-2 block">
            Estratégia geral e plano de seguimento
          </Label>
          <Textarea
            id="conduta"
            value={conduta}
            onChange={(e) => {
              setConduta(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={6}
            placeholder={`Estruture os próximos passos: revisões, exames a solicitar, metas de curto/médio prazo e marcos clínicos.`}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tratamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="tratamento" className="mb-2 block">
            Ajustes de tratamento (medicamentoso e não medicamentoso)
          </Label>
          <Textarea
            id="tratamento"
            value={tratamento}
            onChange={(e) => {
              setTratamento(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={5}
            placeholder={`Liste medicações, doses, duração e justificativa. Inclua também intervenções não farmacológicas acordadas.`}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orientações ao paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="orientacoes" className="mb-2 block">
            Orientações registradas em prontuário
          </Label>
          <Textarea
            id="orientacoes"
            value={orientacoes}
            onChange={(e) => {
              setOrientacoes(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={6}
            placeholder={`Orientações sobre:
- Adesão medicamentosa (horários, o que fazer em esquecimento, etc.).
- Alimentação e atividade física, com metas objetivas.
- Reconhecimento de sinais de alarme (hipo/hiperglicemia, dor torácica, dispneia, etc.).
- Quando procurar serviço de urgência.
- Plano de retorno e acompanhamento.`}
            disabled={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  );
}
