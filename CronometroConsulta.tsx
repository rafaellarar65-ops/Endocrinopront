import { Clock } from "lucide-react";
import { useConsultaTimer } from "@/hooks/useConsultaTimer";

interface CronometroConsultaProps {
  inicioConsulta?: string | null;
}

export function CronometroConsulta({
  inicioConsulta,
}: CronometroConsultaProps) {
  const { formatted, colorClass } = useConsultaTimer(inicioConsulta);

  if (!inicioConsulta) {
    return (
      <div className="px-4 py-2 rounded-lg border text-xs text-gray-500 bg-gray-50 border-gray-200">
        <Clock className="h-4 w-4 inline mr-1 align-middle" />
        <span className="align-middle">Sem horário de início</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm ${colorClass}`}
    >
      <Clock className="h-4 w-4" />
      <span>{formatted}</span>
    </div>
  );
}
