import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Panels, MonitorSmartphone, Save } from "lucide-react";

export default function LayoutsPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Layouts</h1>
              <p className="text-muted-foreground">Personalize a organização de abas, dashboards e relatórios.</p>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" /> Salvar layout
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Panels className="h-5 w-5 text-primary" /> Layout da consulta
                </CardTitle>
                <CardDescription>Ordene abas como Anamnese, Exames, Perfil Metabólico e Resumo Evolutivo.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Arraste e solte componentes (placeholder) e crie visões pré-configuradas para novos usuários.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSmartphone className="h-5 w-5 text-primary" /> Layout de dashboards
                </CardTitle>
                <CardDescription>Selecionar cards de analytics e monitoramento de glicemia.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Inclua gráficos de tendências, alertas automáticos e atalhos para relatórios.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
