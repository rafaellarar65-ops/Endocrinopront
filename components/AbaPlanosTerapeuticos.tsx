import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Send, Printer } from "lucide-react";
import { toast } from "sonner";

interface AbaPlanosTerapeuticosProps {
  consultaId?: number;
}

export function AbaPlanosTerapeuticos({ consultaId }: AbaPlanosTerapeuticosProps) {
  const [versaoAtiva, setVersaoAtiva] = useState<"medico" | "paciente">("medico");
  const [conteudoMedico, setConteudoMedico] = useState("");
  const [conteudoPaciente, setConteudoPaciente] = useState("");

  const gerarPtsMutation = trpc.pts.gerar.useMutation({
    onSuccess: (data: any) => {
      setConteudoMedico(data.versaoMedico);
      setConteudoPaciente(data.versaoPaciente);
      toast.success("Plano Terapêutico gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar plano."),
  });

  const podeGerar = !!consultaId && !gerarPtsMutation.isLoading;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-blue-900">IA Mestra - Gerador de PTS</h3>
            <p className="text-sm text-blue-700">
              Gera automaticamente versões técnicas e simplificadas baseadas na consulta atual.
            </p>
          </div>
          <Button
            onClick={() => consultaId && gerarPtsMutation.mutate({ consultaId })}
            disabled={!podeGerar}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {gerarPtsMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {consultaId ? "Gerar Plano Agora" : "Selecione uma consulta"}
          </Button>
        </CardContent>
      </Card>

      {(conteudoMedico || conteudoPaciente) && (
        <Tabs value={versaoAtiva} onValueChange={(v) => setVersaoAtiva(v as any)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="medico">Versão Médico (Técnica)</TabsTrigger>
              <TabsTrigger value="paciente">Versão Paciente (Simplificada)</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" /> Enviar WhatsApp
              </Button>
            </div>
          </div>

          <TabsContent value="medico">
            <Card>
              <CardContent className="p-0">
                <Textarea
                  value={conteudoMedico}
                  onChange={(e) => setConteudoMedico(e.target.value)}
                  className="min-h-[500px] border-0 p-6 font-mono text-sm resize-none focus-visible:ring-0"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paciente">
            <Card>
              <CardContent className="p-0">
                <Textarea
                  value={conteudoPaciente}
                  onChange={(e) => setConteudoPaciente(e.target.value)}
                  className="min-h-[500px] border-0 p-6 text-base resize-none focus-visible:ring-0 bg-yellow-50/30"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
