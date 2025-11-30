import { useEffect, useState } from "react";

export function useConsultaTimer(inicioISO?: string | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!inicioISO) return;

    const inicioMs = new Date(inicioISO).getTime();
    if (Number.isNaN(inicioMs)) return;

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - inicioMs) / 1000));
      setElapsedSeconds(diff);
    };

    // Atualiza imediato e inicia intervalo
    update();
    const intervalId = setInterval(update, 1000);

    return () => clearInterval(intervalId);
  }, [inicioISO]);

  const format = (seconds: number) => {
    const horas = Math.floor(seconds / 3600);
    const minutos = Math.floor((seconds % 3600) / 60);
    const segs = seconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    if (horas > 0) {
      return `${pad(horas)}:${pad(minutos)}:${pad(segs)}`;
    }
    return `${pad(minutos)}:${pad(segs)}`;
  };

  const getColorClass = (seconds: number) => {
    const minutos = seconds / 60;

    if (minutos < 30) return "text-green-700 bg-green-50 border-green-200";
    if (minutos < 60) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  return {
    elapsedSeconds,
    formatted: format(elapsedSeconds),
    colorClass: getColorClass(elapsedSeconds),
  };
}
