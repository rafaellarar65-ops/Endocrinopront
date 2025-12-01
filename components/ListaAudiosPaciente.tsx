import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileAudio } from "lucide-react";
import { AudioPlayerEnhanced } from "./AudioPlayerEnhanced";

interface AudioData {
  id: number;
  data: string;
  url: string;
  duracao?: string;
  contexto?: string;
}

export function ListaAudiosPaciente({ audios }: { audios: AudioData[] }) {
  if (!audios.length) {
    return (
      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
        <FileAudio className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>Nenhum áudio gravado para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {audios.map((audio) => (
        <Card key={audio.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {new Date(audio.data).toLocaleDateString("pt-BR")}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">{audio.contexto || "Consulta Geral"}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {audio.duracao || "--:--"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AudioPlayerEnhanced src={audio.url} onDownload={() => window.open(audio.url, "_blank")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
