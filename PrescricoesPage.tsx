import AppLayout from "@/components/AppLayout";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Plus, Calendar, Download } from "lucide-react";
import { useState } from "react";
import { ModalNovaPrescricao } from "@/components/prescricoes/ModalNovaPrescricao";

export default function PrescricoesPage() {
  const params = useParams();
  const pacienteId = Number(params.id);
  const [open, setOpen] = useState(false);

  const { data: prescricoes, isLoading } = trpc.prescricoes.listar.useQuery({
    pacienteId,
  });

  const { data: paciente } = trpc.pacientes.getById.useQuery({ id: pacienteId });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Prescrições</h1>
              {paciente && (
                <p className="text-muted-foreground mt-1">
                  Paciente: {paciente.nome}
                </p>
              )}
            </div>
            <Button onClick={() => setOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nova Prescrição
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !prescricoes || prescricoes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma prescrição encontrada
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Clique em "Nova Prescrição" para criar a primeira
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {prescricoes.map((prescricao) => (
                <Card key={prescricao.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Prescrição #{prescricao.id}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(prescricao.dataPrescricao).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      {prescricao.arquivoPdfUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(prescricao.arquivoPdfUrl!, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Medicamentos:</h4>
                        <div className="space-y-2">
                          {prescricao.itens && prescricao.itens.length > 0 ? (
                            prescricao.itens.map((item: any, index: number) => (
                              <div
                                key={index}
                                className="border-l-2 border-primary pl-3 py-1"
                              >
                                <p className="font-medium">
                                  {item.medicamentoTextoLivre || `Medicamento #${item.medicamentoId}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.dosagem} • {item.frequencia} • {item.duracao}
                                </p>
                                {item.orientacoes && (
                                  <p className="text-sm text-muted-foreground italic mt-1">
                                    {item.orientacoes}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Nenhum medicamento registrado
                            </p>
                          )}
                        </div>
                      </div>
                      {prescricao.observacoes && (
                        <div>
                          <h4 className="font-semibold mb-1">Observações:</h4>
                          <p className="text-sm text-muted-foreground">
                            {prescricao.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <ModalNovaPrescricao
            open={open}
            onClose={() => setOpen(false)}
            pacienteId={pacienteId}
          />
        </div>
      </div>
    </AppLayout>
  );
}
