import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, Activity, Download } from "lucide-react";

const indicadores = [
  { titulo: "Taxa de comparecimento", valor: "92%", detalhe: "+3% vs mês anterior" },
  { titulo: "Tempo médio de consulta", valor: "28 min", detalhe: "Meta: 30 min" },
  { titulo: "Pacientes ativos", valor: "1.248", detalhe: "+54 no mês" },
];

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
              <p className="text-muted-foreground">
                Dashboards administrativos, métricas de atendimento e exportação para pesquisa.
              </p>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {indicadores.map((ind) => (
              <Card key={ind.titulo}>
                <CardHeader>
                  <CardTitle>{ind.titulo}</CardTitle>
                  <CardDescription>{ind.detalhe}</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{ind.valor}</CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de saúde populacional</CardTitle>
                <CardDescription>Perfis de risco e evolução de parâmetros críticos.</CardDescription>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg">
                <PieChart className="h-10 w-10 mr-2" /> Gráfico placeholder aguardando dados.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de perfil de pacientes</CardTitle>
                <CardDescription>Distribuição por condição clínica e adesão terapêutica.</CardDescription>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg">
                <BarChart3 className="h-10 w-10 mr-2" /> Dashboard em construção.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios estatísticos</CardTitle>
              <CardDescription>Exportação para pesquisa e monitoramento de qualidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" /> Séries temporais por indicador
              </div>
              <div className="flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4 text-primary" /> Comparação entre unidades/medicos
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" /> Exportação para bases de pesquisa
              </div>
              <Button variant="outline" className="mt-3">Configurar painel</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
