          <TabsContent value="resumo">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resumo da Consulta</CardTitle>
                    <CardDescription>Resumo automático gerado por IA</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      generateSummaryMutation.mutate({ consultaId });
                    }}
                    disabled={generateSummaryMutation.isPending || !consulta.anamnese}
                  >
                    {generateSummaryMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Gerar Resumo com IA
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {consulta.resumo ? (
                  <div className="space-y-6">
                    {/* Resumo Narrativo */}
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">Resumo Narrativo</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-gray-800 leading-relaxed">
                          {(consulta.resumo as any).resumoNarrativo}
                        </p>
                      </div>
                    </div>

                    {/* Principais Queixas */}
                    {(consulta.resumo as any).principaisQueixas?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Principais Queixas</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {(consulta.resumo as any).principaisQueixas.map((queixa: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{queixa}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Achados Relevantes */}
                    {(consulta.resumo as any).achadosRelevantes?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Achados Relevantes</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {(consulta.resumo as any).achadosRelevantes.map((achado: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{achado}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Hipóteses Diagnósticas */}
                    {(consulta.resumo as any).hipotesesDiagnosticas?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Hipóteses Diagnósticas</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {(consulta.resumo as any).hipotesesDiagnosticas.map((hipotese: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{hipotese}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Condutas Propostas */}
                    {(consulta.resumo as any).condutasPropostas?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Condutas Propostas</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {(consulta.resumo as any).condutasPropostas.map((conduta: string, idx: number) => (
                            <li key={idx} className="text-gray-700">{conduta}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Observações Importantes */}
                    {(consulta.resumo as any).observacoesImportantes && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Observações Importantes</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-gray-800">{(consulta.resumo as any).observacoesImportantes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Nenhum resumo gerado ainda</p>
                    <p className="text-sm text-gray-500">
                      Clique em "Gerar Resumo com IA" para criar um resumo automático da consulta
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>