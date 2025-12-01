import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FilePlus, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function NovaConsultaPage() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Iniciar consulta</h1>
              <p className="text-muted-foreground">Selecione um paciente e configure a captura automática de resumo.</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/pacientes")}>Ir para lista de pacientes</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md cursor-pointer" onClick={() => setLocation("/pacientes") }>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Selecionar paciente
                </CardTitle>
                <CardDescription>Escolha um paciente existente para continuar o atendimento.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Buscar paciente</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> Consolidação automática
                </CardTitle>
                <CardDescription>Ative o hook automático de geração de resumo ao concluir a consulta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>O sistema aplicará o último resumo evolutivo e atualizará com IA ao finalizar.</p>
                <p>Reutiliza históricos de anamnese, exame físico e conduta para gerar o consolidado.</p>
                <div className="pt-2">
                  <Button variant="secondary">Habilitar na próxima consulta</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-primary" /> Protocolos de pré-consulta
              </CardTitle>
              <CardDescription>Checklist de laboratório, bioimpedância e formulários de consentimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Configure o pré-envio de orientações e solicitação de exames antes da consulta.</p>
              <Button variant="outline" onClick={() => setLocation("/protocolos")}>Gerenciar protocolos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
