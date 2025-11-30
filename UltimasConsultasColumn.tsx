import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRightCircle } from "lucide-react";
import { useLocation } from "wouter";

interface UltimasConsultasColumnProps {
  consultaIdAtual: number;
  pacienteId?: number | null;
}

export function UltimasConsultasColumn({
  consultaIdAtual,
  pacienteId,
}: UltimasConsultasColumnProps) {
  const [, setLocation] = useLocation();

  const {
    data: ultimasConsultas,
    isLoading,
    isError,
    refetch,
  } = (trpc.consultas as any).getUltimasConsultas.useQuery(
    {
      pacienteId: pacienteId ?? 0,
      limit: 5,
    },
    { enabled: !!pacienteId }
  );

  const handleClickConsulta = (id: number) => {
    if (id === consultaIdAtual) return;
    setLocation(`/consulta/${id}`);
  };

  return (
    <aside className="w-[20%] border-l bg-gray-50 flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-white">
        <h3 className="text-sm font-semibold">Últimas consultas</h3>
        <p className="text-[11px] text-gray-500">
          Histórico recente deste paciente
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-gray-500 text-xs">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Carregando histórico...
          </div>
        )}

        {isError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <p>Erro ao carregar últimas consultas.</p>
            <button
              onClick={() => refetch()}
              className="underline underline-offset-2 text-blue-600 mt-1"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading &&
          !isError &&
          pacienteId &&
          (!ultimasConsultas || ultimasConsultas.length === 0) && (
            <div className="text-xs text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg p-3">
              Nenhuma outra consulta registrada para este paciente.
            </div>
          )}

        {!isLoading &&
          !isError &&
          ultimasConsultas &&
          ultimasConsultas.length > 0 && (
            <div className="space-y-2">
              {ultimasConsultas.map((cons: any) => {
                const isAtual = cons.id === consultaIdAtual;

                return (
                  <Card
                    key={cons.id}
                    className={`cursor-pointer transition-all ${
                      isAtual
                        ? "border-blue-500 border-2 shadow-sm"
                        : "hover:shadow-md hover:border-gray-300"
                    }`}
                    onClick={() => handleClickConsulta(cons.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-700">
                          {new Date(cons.dataHora).toLocaleDateString("pt-BR")}
                        </div>
                        {isAtual && (
                          <Badge variant="default" className="text-[10px] px-2 py-0">
                            Atual
                          </Badge>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-600 line-clamp-2">
                        {cons.queixaPrincipal || "Sem queixa registrada"}
                      </div>

                      {!isAtual && (
                        <div className="flex items-center justify-end mt-2 text-blue-600 text-[10px]">
                          <span className="mr-1">Ver consulta</span>
                          <ArrowRightCircle className="h-3 w-3" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
      </div>
    </aside>
  );
}
