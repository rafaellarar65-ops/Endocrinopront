import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Brain, Sparkles, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface AbaResumoEvolutivoProps {
  consultaId: number;
}

export function AbaResumoEvolutivo({ consultaId }: AbaResumoEvolutivoProps) {
  const [temNovosDados, setTemNovosDados] = useState(false);

  // Buscar consulta
  const { data: consulta, isLoading: isLoadingConsulta } =
    trpc.consultas.getById.useQuery({ id: consultaId });

  // Buscar resumo evolutivo
  const { data: resumoData, refetch: refetchResumo } =
    trpc.consultas.obterResumoEvolutivo.useQuery({ consultaId });

  // Importar último resumo
  const importarResumoMutation = trpc.consultas.importarUltimoResumo.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchResumo();
      } else {
        toast.info(data.message);
      }
    },
    onError: () => {
      toast.error("Erro ao importar resumo anterior");
    },
  });

  // Gerar resumo evolutivo
  const gerarResumoMutation = trpc.consultas.gerarResumoEvolutivo.useMutation({
    onSuccess: () => {
      toast.success("Resumo evolutivo gerado com sucesso!");
      refetchResumo();
      setTemNovosDados(false);
    },
    onError: () => {
      toast.error("Erro ao gerar resumo evolutivo");
    },
  });

  // Importar resumo automaticamente ao abrir consulta sem resumo
  useEffect(() => {
    if (consulta && !resumoData?.temResumo && !importarResumoMutation.isPending) {
      // Aguardar 1 segundo antes de importar (para não conflitar com carregamento inicial)
      const timer = setTimeout(() => {
        importarResumoMutation.mutate({ consultaId });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [consulta, resumoData?.temResumo]);

  // Detectar novos dados (simulação - em produção, verificar se anamnese/exame físico foram alterados)
  useEffect(() => {
    if (consulta?.anamnese || consulta?.exameFisico) {
      setTemNovosDados(true);
    }
  }, [consulta?.anamnese, consulta?.exameFisico]);

  if (isLoadingConsulta) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleGerarResumo = () => {
    gerarResumoMutation.mutate({ consultaId });
  };

  const handleImportarResumo = () => {
    importarResumoMutation.mutate({ consultaId });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo Evolutivo do Paciente
            </CardTitle>
            <CardDescription>
              Resumo consolidado que evolui a cada consulta, integrando histórico anterior com dados atuais
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!resumoData?.temResumo && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportarResumo}
                disabled={importarResumoMutation.isPending}
              >
                {importarResumoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Importar Último Resumo
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleGerarResumo}
              disabled={gerarResumoMutation.isPending}
              className={temNovosDados ? "bg-green-600 hover:bg-green-700 animate-pulse" : ""}
            >
              {gerarResumoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  {temNovosDados ? "Atualizar Resumo com IA" : "Gerar Resumo com IA"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {resumoData?.resumoEvolutivo ? (
          <div className="space-y-6">
            {/* Indicador de Status */}
            <div className="flex items-center gap-2">
              {temNovosDados ? (
                <Badge variant="default" className="bg-yellow-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Há novos dados - clique em "Atualizar Resumo"
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resumo atualizado
                </Badge>
              )}
            </div>

            {/* Resumo Consolidado */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg text-blue-900">Resumo Consolidado</h3>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800">
                <p className="whitespace-pre-wrap leading-relaxed">{resumoData.resumoEvolutivo}</p>
              </div>
            </div>

            {/* Informações sobre o Sistema */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">💡 Como funciona o Resumo Evolutivo:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Ao abrir uma nova consulta, o sistema importa automaticamente o último resumo</li>
                <li>Quando você adiciona novos dados (anamnese, exame físico, hipóteses), o botão fica destacado</li>
                <li>Ao clicar em "Atualizar Resumo", a IA combina o histórico anterior com os novos dados</li>
                <li>Ao finalizar a consulta, o resumo é consolidado automaticamente para a próxima consulta</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum resumo evolutivo ainda</h3>
            <p className="text-gray-600 mb-4">
              {importarResumoMutation.isPending
                ? "Importando resumo da última consulta..."
                : "Clique em 'Importar Último Resumo' ou 'Gerar Resumo com IA' para começar"}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto text-left">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">📋 O que é o Resumo Evolutivo?</h4>
              <p className="text-sm text-blue-800">
                É um resumo consolidado que evolui a cada consulta, integrando o histórico clínico anterior
                com os novos dados da consulta atual. Isso permite acompanhar a evolução do paciente ao longo
                do tempo de forma inteligente e automatizada.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
