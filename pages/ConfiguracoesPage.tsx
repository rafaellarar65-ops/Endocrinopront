import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { Filter, Headphones, Search, ShieldCheck, Brain } from "lucide-react";

const MOCK_AUDIOS = [
  { id: "AUD-1245", paciente: "Ana Souza", data: "2024-07-18", duracao: "03:45", tags: ["retorno", "endócrino"] },
  { id: "AUD-1246", paciente: "Carlos Lima", data: "2024-07-17", duracao: "02:10", tags: ["follow-up"] },
  { id: "AUD-1247", paciente: "Fernanda Dias", data: "2024-07-17", duracao: "04:32", tags: ["bioimpedância", "relato"] },
];

export default function ConfiguracoesPage() {
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [autoResumoAtivo, setAutoResumoAtivo] = useState(true);
  const [backupAtivo, setBackupAtivo] = useState(true);

  const audiosFiltrados = useMemo(() => {
    return MOCK_AUDIOS.filter((audio) => {
      const matchBusca = audio.paciente.toLowerCase().includes(busca.toLowerCase()) || audio.id.toLowerCase().includes(busca.toLowerCase());
      const matchTag = !filtroTag || audio.tags.includes(filtroTag);
      return matchBusca && matchTag;
    });
  }, [busca, filtroTag]);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">Centralize o acesso ao backup de áudios e automação de resumos.</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" /> Backup de áudios (acesso global)
                </CardTitle>
                <CardDescription>Acompanhe todos os áudios gravados, com filtros rápidos e download.</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-80">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Buscar por paciente ou ID"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => setFiltroTag(null)}>
                  <Filter className="h-4 w-4 mr-2" /> Limpar filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {Array.from(new Set(MOCK_AUDIOS.flatMap((a) => a.tags))).map((tag) => (
                  <Badge
                    key={tag}
                    variant={filtroTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFiltroTag((prev) => (prev === tag ? null : tag))}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {audiosFiltrados.map((audio) => (
                  <Card key={audio.id} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{audio.id}</span>
                        <Badge variant="outline">{audio.duracao}</Badge>
                      </CardTitle>
                      <CardDescription>{audio.paciente} • {new Date(audio.data).toLocaleDateString("pt-BR")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {audio.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="secondary">Download</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" /> Consolidação automática do resumo evolutivo
              </CardTitle>
              <CardDescription>Ative o hook automático ao finalizar consultas e reaproveite o último resumo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Gerar resumo automaticamente</p>
                  <p className="text-sm text-muted-foreground">Executa a IA ao mudar o status para concluída.</p>
                </div>
                <Switch checked={autoResumoAtivo} onCheckedChange={setAutoResumoAtivo} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reaproveitar último resumo</p>
                  <p className="text-sm text-muted-foreground">Importa o resumo evolutivo anterior antes de gerar o novo.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline">Configurar prompt de IA</Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Preferências gerais
              </CardTitle>
              <CardDescription>Aplicadas globalmente a novos módulos (agenda, relatórios, glicemia).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Backup automático S3</Label>
                <Switch checked={backupAtivo} onCheckedChange={setBackupAtivo} />
              </div>
              <div className="space-y-2">
                <Label>Dashboards administrativos</Label>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Monitoramento de glicemia</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
