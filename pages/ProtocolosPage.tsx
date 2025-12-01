import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";

const protocolos = [
  { nome: "Pré-consulta DM2", etapas: 4, ativo: true },
  { nome: "Bioimpedância anual", etapas: 3, ativo: false },
];

export default function ProtocolosPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Protocolos salvos</h1>
              <p className="text-muted-foreground">Organize checklists, exames e notificações pré ou pós-consulta.</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo protocolo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {protocolos.map((p) => (
              <Card key={p.nome} className="hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" /> {p.nome}
                  </CardTitle>
                  <CardDescription>{p.etapas} etapas configuradas</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${p.ativo ? "text-green-500" : "text-gray-400"}`} />
                    {p.ativo ? "Ativo" : "Rascunho"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Editar</Button>
                    <Button size="sm" variant="secondary">Aplicar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
