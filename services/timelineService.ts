import * as db from "../db";

export type EventoTimeline = {
  id: string;
  data: Date;
  tipo: "consulta" | "exame" | "bioimpedancia" | "marco";
  titulo: string;
  subtitulo?: string;
  detalhes?: any;
  tags?: string[];
  importancia: "alta" | "normal" | "baixa";
};

export class TimelineService {
  static async buscarHistoricoCompleto(pacienteId: number): Promise<EventoTimeline[]> {
    const eventos: EventoTimeline[] = [];

    const consultas = await db.getConsultasByPaciente(pacienteId);
    consultas.forEach((consulta) => {
      const conduta = consulta.conduta || "";
      const temAlteracaoConduta = conduta.toLowerCase().includes("ajuste") || conduta.toLowerCase().includes("inicia");

      eventos.push({
        id: `cons-${consulta.id}`,
        data: consulta.dataHora,
        tipo: "consulta",
        titulo: "Consulta Médica",
        subtitulo: (consulta.anamnese as any)?.queixaPrincipal || "Rotina",
        detalhes: {
          hipoteses: consulta.hipotesesDiagnosticas,
          conduta: consulta.conduta,
        },
        tags: consulta.status ? [consulta.status] : [],
        importancia: temAlteracaoConduta ? "alta" : "normal",
      });
    });

    const exames = await db.getExamesByPaciente(pacienteId);
    exames.forEach((exame) => {
      const resultados = Array.isArray(exame.resultados) ? exame.resultados : [];
      const temCritico = resultados.some((resultado: any) => resultado.status === "critico");

      eventos.push({
        id: `exam-${exame.id}`,
        data: exame.dataExame,
        tipo: "exame",
        titulo: exame.tipo || "Exame Laboratorial",
        subtitulo: exame.laboratorio,
        detalhes: {
          resultadosCount: resultados.length,
          observacoes: exame.observacoes,
        },
        tags: temCritico ? ["crítico"] : [],
        importancia: temCritico ? "alta" : "normal",
      });
    });

    const bios = await db.getBioimpedanciasByPaciente(pacienteId);
    bios.forEach((bio) => {
      const res = bio.resultados as any;
      eventos.push({
        id: `bia-${bio.id}`,
        data: bio.dataAvaliacao,
        tipo: "bioimpedancia",
        titulo: "Bioimpedância",
        subtitulo: res?.peso ? `${res.peso}kg • GC: ${res.percentualGordura}%` : undefined,
        importancia: "normal",
      });
    });

    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime());
  }
}
