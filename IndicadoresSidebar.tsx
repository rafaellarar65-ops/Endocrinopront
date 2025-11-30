import { Activity, TrendingUp, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IndicadoresSidebarProps {
  consultaId: number;
  pacienteNome?: string;
}

interface EscoreSugestao {
  id: string;
  nome: string;
  categoria: string;
  prioridade: "alta" | "media" | "baixa";
  contextoClinico: string;
  motivoRelevancia: string;
  dadosNecessarios: string[];
  guidelineReferencia?: string;
}

export function IndicadoresSidebar({
  consultaId,
  pacienteNome,
}: IndicadoresSidebarProps) {
  const {
    data: escores,
    isLoading,
    isError,
    refetch,
  } = trpc.exameFisico.sugerirEscores.useQuery(
    { consultaId },
    {
      enabled: !!consultaId,
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );

  return (
    <aside className="w-[20%] h-full overflow-y-auto bg-gradient-to-b from-blue-900 to-blue-950 text-white p-4">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-300" />
            <h2 className="text-base font-bold">Indicadores Clínicos</h2>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sincronizar com IA"
          >
            <RefreshCw className={`h-4 w-4 text-blue-200 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {pacienteNome && (
          <p className="text-[11px] text-blue-200">
            Escores sugeridos pela IA para <strong>{pacienteNome}</strong>
          </p>
        )}
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-blue-200">
            <RefreshCw className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs">Analisando dados clínicos...</p>
          </div>
        )}

        {/* Erro */}
        {isError && (
          <div className="text-[11px] text-red-200 bg-red-900/40 border border-red-700 rounded-lg p-3">
            <p className="font-semibold mb-1">Erro ao carregar sugestões</p>
            <p className="mb-2">
              Não foi possível gerar sugestões de escores. Verifique se a
              consulta possui dados suficientes.
            </p>
            <button
              onClick={() => refetch()}
              className="underline underline-offset-2 text-blue-100 text-left"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Nenhum escore */}
        {!isLoading &&
          !isError &&
          (!escores || escores.length === 0) && (
            <div className="text-[11px] text-blue-100 bg-blue-800/60 border border-dashed border-blue-700 rounded-lg p-3">
              <p className="font-semibold mb-1">
                Nenhum escore específico sugerido
              </p>
              <p className="text-blue-200">
                Com os dados atuais, a IA não identificou escores de risco que
                mudem de forma relevante a condução. Reavalie após novos exames
                ou melhor definição diagnóstica.
              </p>
            </div>
          )}

        {/* Lista de escores sugeridos */}
        {!isLoading &&
          !isError &&
          escores &&
          (escores as EscoreSugestao[]).length > 0 &&
          (escores as EscoreSugestao[]).map((esc) => (
            <Card
              key={esc.id}
              className="bg-blue-800 border border-blue-700 text-white"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {esc.nome}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 border-blue-300 text-blue-50"
                  >
                    {esc.categoria}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 text-[11px] text-blue-100">
                {/* Prioridade */}
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="font-semibold">
                    Prioridade:{" "}
                    <span
                      className={
                        esc.prioridade === "alta"
                          ? "text-red-200"
                          : esc.prioridade === "media"
                          ? "text-yellow-200"
                          : "text-green-200"
                      }
                    >
                      {esc.prioridade.toUpperCase()}
                    </span>
                  </span>
                </div>

                {/* Contexto clínico */}
                <div>
                  <p className="font-semibold text-blue-50">
                    Contexto clínico
                  </p>
                  <p>{esc.contextoClinico}</p>
                </div>

                {/* Motivo de relevância */}
                <div>
                  <p className="font-semibold text-blue-50">
                    Motivo da relevância
                  </p>
                  <p>{esc.motivoRelevancia}</p>
                </div>

                {/* Dados necessários */}
                <div>
                  <p className="font-semibold text-blue-50">
                    Dados necessários
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {esc.dadosNecessarios.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Guideline */}
                {esc.guidelineReferencia && (
                  <p className="text-[10px] text-blue-200 italic">
                    Ref.: {esc.guidelineReferencia}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </aside>
  );
}
