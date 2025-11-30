// client/src/components/SugestoesModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type AbaTipo = "hma" | "exame_fisico" | "resumo" | "hipoteses" | "plano";

export interface Sugestao {
  campo: string;
  tipoSugestao: "complementar" | "calcular" | "atualizar" | "adicionar" | "corrigir";
  sugestao: string;
  fundamentacao: string;
  textoSugerido?: string;
  prioridade: "alta" | "media" | "baixa";
}

interface SugestoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultaId: number;
  aba: AbaTipo;
  onAplicar: (sugestoesAceitas: Sugestao[]) => void;
}

const ABA_LABELS: Record<AbaTipo, string> = {
  hma: "HMA",
  exame_fisico: "Exame Físico",
  resumo: "Resumo",
  hipoteses: "Hipóteses Diagnósticas",
  plano: "Plano Terapêutico",
};

export function SugestoesModal({
  open,
  onOpenChange,
  consultaId,
  aba,
  onAplicar,
}: SugestoesModalProps) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [sugestoesAceitas, setSugestoesAceitas] = useState<Set<number>>(new Set());

  const getAbaSuggestionsMutation = trpc.consultas.getAbaSuggestions.useMutation({
    onSuccess: (data) => {
      setSugestoes(data as Sugestao[]);
      setSugestoesAceitas(new Set());
    },
    onError: (error) => {
      toast.error("Erro ao gerar sugestões: " + error.message);
    },
  });

  // sempre que abrir o modal ou mudar aba/consulta, dispara a IA
  useEffect(() => {
    if (open && consultaId) {
      getAbaSuggestionsMutation.mutate({ consultaId, aba });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, consultaId, aba]);

  const toggleSugestao = (index: number) => {
    const novas = new Set(sugestoesAceitas);
    if (novas.has(index)) novas.delete(index);
    else novas.add(index);
    setSugestoesAceitas(novas);
  };

  const handleAplicar = () => {
    const aceitas = sugestoes.filter((_, idx) => sugestoesAceitas.has(idx));
    if (aceitas.length === 0) return;

    onAplicar(aceitas);
    toast.success(`${aceitas.length} sugestão(ões) aplicada(s)!`);
    onOpenChange(false);
  };

  const isLoading = getAbaSuggestionsMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Sugestões da IA para {ABA_LABELS[aba]}
          </DialogTitle>
          <DialogDescription>
            A IA analisou toda a consulta e sugere as seguintes melhorias para esta seção.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && sugestoes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma sugestão disponível no momento.
          </div>
        )}

        {!isLoading && sugestoes.length > 0 && (
          <div className="space-y-3 mt-2">
            {sugestoes.map((sugestao, idx) => (
              <Card
                key={idx}
                className={`cursor-pointer transition-all ${
                  sugestoesAceitas.has(idx)
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
                onClick={() => toggleSugestao(idx)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {sugestoesAceitas.has(idx) ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            sugestao.prioridade === "alta"
                              ? "destructive"
                              : sugestao.prioridade === "media"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {sugestao.prioridade.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{sugestao.tipoSugestao}</Badge>
                        <span className="font-semibold text-gray-900">
                          {sugestao.campo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {sugestao.sugestao}
                      </p>
                      <p className="text-xs text-gray-600 italic mb-2">
                        💡 {sugestao.fundamentacao}
                      </p>
                      {sugestao.textoSugerido && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Texto sugerido:
                          </p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {sugestao.textoSugerido}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-sm text-gray-600">
            {sugestoesAceitas.size} de {sugestoes.length} selecionada(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAplicar} disabled={sugestoesAceitas.size === 0}>
              Aplicar Sugestões
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
