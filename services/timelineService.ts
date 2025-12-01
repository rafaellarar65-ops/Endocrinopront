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

    // 1. Consultas e marcos terapêuticos
    const consultas = await db.getConsultasByPaciente(pacienteId);
    consultas.forEach((consulta) => {
      const conduta = consulta.conduta?.toLowerCase() || "";
      // Lógica avançada para detectar marcos clínicos importantes
      const isMarco = /inicia|introduz|suspende|alta/.test(conduta);
      const isAjuste = /aumenta|reduz|ajusta/.test(conduta);

      eventos.push({
        id: `cons-${consulta.id}`,
        data: consulta.dataHora,
        tipo: isMarco ? "marco" : "consulta",
        titulo: isMarco ? "Marco Clínico" : "Consulta Médica",
        subtitulo: (consulta.anamnese as any)?.queixaPrincipal || "Acompanhamento",
        detalhes: {
          soap: {
            s: (consulta.anamnese as any)?.queixaPrincipal,
            o: (consulta.exameFisico as any)?.exameGeral,
            a: consulta.hipotesesDiagnosticas,
            p: consulta.conduta,
          },
        },
        tags: consulta.status ? [consulta.status] : [],
        importancia: isMarco || isAjuste ? "alta" : "normal",
      });
    });

    // 2. Exames
    const exames = await db.getExamesByPaciente(pacienteId);
    exames.forEach((exame) => {
      const resultados = Array.isArray(exame.resultados) ? exame.resultados : [];
      // Conta quantos resultados foram marcados como críticos pela IA ou manualmente
      const criticos = resultados.filter((resultado: any) => resultado.status === "critico").length;

      eventos.push({
        id: `exam-${exame.id}`,
        data: exame.dataExame,
        tipo: "exame",
        titulo: exame.tipo || "Exames Laboratoriais",
        subtitulo: `${resultados.length} parâmetros`,
        detalhes: { resultados },
        tags: criticos > 0 ? [`${criticos} críticos`] : [],
        importancia: criticos > 0 ? "alta" : "normal",
      });
    });

    // 3. Bioimpedância
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

    // Ordenação cronológica decrescente (mais recente primeiro)
    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime());
  }
}