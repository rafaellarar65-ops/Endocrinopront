import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Star, FileText } from "lucide-react";
import { useMemo, useState } from "react";

const MOCK_TEMPLATES = [
  {
    id: 1,
    nome: "Atestado de acompanhamento",
    categoria: "Documentos",
    tags: ["atestado", "trabalho"],
    favorito: true,
    atualizadoEm: "2024-07-18",
  },
  {
    id: 2,
    nome: "Plano terapêutico para DM2",
    categoria: "Conduta clínica",
    tags: ["diabetes", "endócrino"],
    favorito: false,
    atualizadoEm: "2024-07-12",
  },
  {
    id: 3,
    nome: "Carta de encaminhamento cardiologia",
    categoria: "Encaminhamento",
    tags: ["cardio", "referência"],
    favorito: false,
    atualizadoEm: "2024-07-10",
  },
];

export default function TemplatesPage() {
  const [busca, setBusca] = useState("");
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  const templatesFiltrados = useMemo(() => {
    return MOCK_TEMPLATES.filter((tpl) => {
      const matchBusca = tpl.nome.toLowerCase().includes(busca.toLowerCase());
      const matchFavorito = !mostrarFavoritos || tpl.favorito;
      return matchBusca && matchFavorito;
    });
  }, [busca, mostrarFavoritos]);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Templates de Documentos</h1>
              <p className="text-muted-foreground">
                Biblioteca pronta para uso com campos dinâmicos e integrações futuras com Canva.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={mostrarFavoritos ? "secondary" : "outline"} onClick={() => setMostrarFavoritos((v) => !v)}>
                <Star className="h-4 w-4 mr-2" />
                Favoritos
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo template
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Biblioteca reutilizável</CardTitle>
                <CardDescription>
                  Use filtros por nome, categoria ou marcadores clínicos. Suporte futuro a merge fields.
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-80">
                <Input
                  placeholder="Buscar templates"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {templatesFiltrados.map((tpl) => (
                <Card key={tpl.id} className="border-dashed">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> {tpl.nome}
                      </CardTitle>
                      <CardDescription>{tpl.categoria}</CardDescription>
                    </div>
                    {tpl.favorito && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {tpl.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Atualizado em {new Date(tpl.atualizadoEm).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        Pré-visualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
