import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, Stethoscope, AlertTriangle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICONES: Record<string, any> = {
  consulta: Stethoscope,
  exame: FileText,
  bioimpedancia: Activity,
  marco: ArrowRight,
};

const CORES: Record<string, string> = {
  consulta: "bg-blue-100 text-blue-700",
  exame: "bg-purple-100 text-purple-700",
  bioimpedancia: "bg-green-100 text-green-700",
  marco: "bg-amber-100 text-amber-700",
};

interface TimelineEvolucaoProps {
  pacienteId: number;
}

export function TimelineEvolucao({ pacienteId }: TimelineEvolucaoProps) {
  const { data: eventos, isLoading } = trpc.timeline.getHistorico.useQuery({ pacienteId });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando linha do tempo...</div>;

  return (
    <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-4">
      {eventos?.map((evento: any) => {
        const Icon = ICONES[evento.tipo] || FileText;
        const cor = CORES[evento.tipo] || "bg-gray-100";

        return (
          <div key={evento.id} className="relative pl-8 group">
            <div
              className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ring-2 ring-gray-200 ${
                evento.importancia === "alta" ? "bg-red-500" : "bg-gray-400"
              }`}
            />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-md ${cor}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {format(new Date(evento.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  {evento.tags?.includes("crítico") && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Atenção
                    </Badge>
                  )}
                </div>

                <h4 className="text-base font-semibold text-gray-800">{evento.titulo}</h4>
                {evento.subtitulo && <p className="text-sm text-gray-600">{evento.subtitulo}</p>}

                {evento.tipo === "consulta" && evento.detalhes?.conduta && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700 border border-gray-100">
                    <strong>Conduta:</strong> {evento.detalhes.conduta}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
