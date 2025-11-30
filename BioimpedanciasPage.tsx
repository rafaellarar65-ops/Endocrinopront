import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function BioimpedanciasPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = trpc.bioimpedancias.listAll.useQuery({
    page,
    limit,
  });

  const handleViewReport = (bioId: number, pacienteId: number) => {
    setLocation(`/bioimpedancia/${pacienteId}`);
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Bioimpedâncias</h1>
            <p className="text-gray-600 mt-2">
              Histórico completo de avaliações de composição corporal
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#2C5AA0]" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhuma bioimpedância registrada no sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {data.items.map((item: any) => {
                  const bio = item.bioimpedancia;
                  const paciente = item.paciente;
                  
                  return (
                    <Card
                      key={bio.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewReport(bio.id, bio.pacienteId)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {paciente?.nome || "Paciente não encontrado"}
                              </h3>
                              <span className="text-sm text-gray-500">
                                CPF: {paciente?.cpf || "N/A"}
                              </span>
                            </div>
                            
                            <div className="flex gap-6 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Data:</span>{" "}
                                {new Date(bio.dataAvaliacao).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </div>
                              
                              {bio.resultados?.peso && (
                                <div>
                                  <span className="font-medium">Peso:</span>{" "}
                                  {bio.resultados.peso} kg
                                </div>
                              )}
                              
                              {bio.resultados?.imc && (
                                <div>
                                  <span className="font-medium">IMC:</span>{" "}
                                  {bio.resultados.imc}
                                </div>
                              )}
                              
                              {bio.resultados?.percentualGordura && (
                                <div>
                                  <span className="font-medium">Gordura:</span>{" "}
                                  {bio.resultados.percentualGordura}%
                                </div>
                              )}
                              
                              {bio.resultados?.massaMuscular && (
                                <div>
                                  <span className="font-medium">Massa Muscular:</span>{" "}
                                  {bio.resultados.massaMuscular} kg
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(bio.id, bio.pacienteId);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Relatório
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Paginação */}
              {data.totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, data.total)} de {data.total} registros
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          // Mostra primeira, última e páginas próximas à atual
                          return (
                            p === 1 ||
                            p === data.totalPages ||
                            (p >= page - 1 && p <= page + 1)
                          );
                        })
                        .map((p, idx, arr) => {
                          // Adiciona "..." entre páginas não consecutivas
                          const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                          
                          return (
                            <div key={p} className="flex items-center gap-2">
                              {showEllipsis && (
                                <span className="text-gray-400">...</span>
                              )}
                              <Button
                                variant={p === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="w-10"
                              >
                                {p}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
