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
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";

interface AbaHipotesesCondutaProps {
  consultaId: number;
}

export function AbaHipotesesConduta({
  consultaId,
}: AbaHipotesesCondutaProps) {
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
  const [planoTerapeutico, setPlanoTerapeutico] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carrega valores iniciais
  useEffect(() => {
    if (!consulta) return;

    setHipoteses(consulta.hipotesesDiagnosticas ?? "");
    setPlanoTerapeutico(consulta.conduta ?? "");
    setOrientacoes(consulta.observacoes ?? "");
    setHasUnsavedChanges(false);
  }, [consulta]);

  const handleSalvar = async () => {
    if (!consulta) return;
    try {
      await updateMutation.mutateAsync({
        consultaId: consulta.id,
        hipotesesDiagnosticas: hipoteses || null,
        conduta: planoTerapeutico || null,
        observacoes: orientacoes || null,
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
          Hipóteses diagnósticas e conduta
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAtualizarComIA}
            disabled={iaMutation.isPending}
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
            disabled={!hasUnsavedChanges || updateMutation.isPending}
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
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plano terapêutico</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="plano" className="mb-2 block">
            Descreva o plano terapêutico (medicamentoso e não medicamentoso)
          </Label>
          <Textarea
            id="plano"
            value={planoTerapeutico}
            onChange={(e) => {
              setPlanoTerapeutico(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={8}
            placeholder={`Estruturar em tópicos:
- Ajustes de medicação (nome, posologia, justificativa).
- Solicitação ou revisão de exames complementares.
- Encaminhamentos (nutrição, psicologia, cardiologia etc.).
- Metas terapêuticas (peso, HbA1c, PA, lipídios).
- Estratégia de seguimento (prazo para retorno, sinais de alerta).`}
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
