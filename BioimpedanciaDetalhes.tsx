import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Upload, TrendingDown, TrendingUp, Activity, Weight, Ruler, FileDown, Printer } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { BioimpedanciaPDFInBody } from "@/services/BioimpedanciaPDFInBody";
import EvolutionChart from "@/components/EvolutionChart";
import BodyAvatar from "@/components/BodyAvatar";

export default function BioimpedanciaDetalhes() {
  const { id } = useParams();
  const pacienteId = parseInt(id || "0");
  
  const { data: paciente } = trpc.pacientes.getById.useQuery({ id: pacienteId });
  const { data: bioimpedancias, refetch } = trpc.bioimpedancias.list.useQuery({ pacienteId });
  
  const [uploading, setUploading] = useState(false);
  const [selectedBio, setSelectedBio] = useState<any>(null);
  
  const uploadMutation = trpc.bioimpedancias.uploadExcel.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      toast.error('Por favor, selecione um arquivo Excel (.xls ou .xlsx)');
      return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setUploading(true);
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove o prefixo "data:...;base64,"
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(file);
      const fileBase64 = await base64Promise;
      
      // Enviar para o backend
      const result = await uploadMutation.mutateAsync({
        pacienteId,
        fileBase64,
        fileName: file.name,
      });
      
      toast.success(`${result.count} medição(s) importada(s) com sucesso!`);
      refetch();
      
      // Limpar input
      e.target.value = '';
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo de bioimpedância');
    } finally {
      setUploading(false);
    }
  };

  // Selecionar a bioimpedância mais recente por padrão
  const bioAtual = selectedBio || bioimpedancias?.[0];

  if (!paciente) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análise Corporal</h1>
            <p className="text-gray-600 mt-1">{paciente.nome}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {bioAtual && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!paciente || !bioAtual) return;
                    BioimpedanciaPDFInBody.download({
                      paciente: {
                        nome: paciente.nome,
                        cpf: paciente.cpf || "N/A",
                        dataNascimento: paciente.dataNascimento?.toString() || new Date().toString(),
                        sexo: paciente.sexo || "M",
                      },
                      bioimpedancia: {
                        dataAvaliacao: bioAtual.dataAvaliacao?.toString() || new Date().toString(),
                        resultados: bioAtual.resultados,
                      },
                      historico: bioimpedancias || [],
                    });
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!paciente || !bioAtual) return;
                    BioimpedanciaPDFInBody.print({
                      paciente: {
                        nome: paciente.nome,
                        cpf: paciente.cpf || "N/A",
                        dataNascimento: paciente.dataNascimento?.toString() || new Date().toString(),
                        sexo: paciente.sexo || "M",
                      },
                      bioimpedancia: {
                        dataAvaliacao: bioAtual.dataAvaliacao?.toString() || new Date().toString(),
                        resultados: bioAtual.resultados,
                      },
                      historico: bioimpedancias || [],
                    });
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </>
            )}
            <Input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="bio-upload"
            />
            <Button
              onClick={() => document.getElementById("bio-upload")?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Processando..." : "Upload Excel"}
            </Button>
          </div>
        </div>

        {!bioAtual ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma análise corporal encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Faça upload de um arquivo Excel para começar
              </p>
              <Button onClick={() => document.getElementById("bio-upload")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Peso Corporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#2C5AA0]">
                    {bioAtual.resultados?.peso || "N/A"} kg
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    IMC: {bioAtual.resultados?.imc || "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Gordura Corporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {bioAtual.resultados?.gorduraCorporal || "N/A"}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {bioAtual.resultados?.massaGordura || "N/A"} kg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Massa Muscular
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {bioAtual.resultados?.massaMuscular || "N/A"} kg
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Taxa: {bioAtual.resultados?.taxaMuscular || "N/A"}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Água Corporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {bioAtual.resultados?.aguaCorporal || "N/A"}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {bioAtual.resultados?.teorAgua || "N/A"} kg
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Composição do Corpo Humano */}
            <Card>
              <CardHeader>
                <CardTitle>Composição do Corpo Humano</CardTitle>
                <CardDescription>Distribuição dos componentes corporais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Água corporal</span>
                      <span className="text-sm text-gray-600">
                        {bioAtual.resultados?.aguaCorporal || "N/A"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ width: `${bioAtual.resultados?.aguaCorporal || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Proteína</span>
                      <span className="text-sm text-gray-600">
                        {bioAtual.resultados?.proteina || "N/A"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${bioAtual.resultados?.proteina || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Minerais</span>
                      <span className="text-sm text-gray-600">
                        {bioAtual.resultados?.minerais || "N/A"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full" 
                        style={{ width: `${bioAtual.resultados?.minerais || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Massa gorda</span>
                      <span className="text-sm text-gray-600">
                        {bioAtual.resultados?.gorduraCorporal || "N/A"}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-3 rounded-full" 
                        style={{ width: `${bioAtual.resultados?.gorduraCorporal || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Situação Musculoesquelética */}
            <Card>
              <CardHeader>
                <CardTitle>Situação Musculoesquelética</CardTitle>
                <CardDescription>Análise da massa muscular por segmento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Massa muscular total", value: bioAtual.resultados?.massaMuscular, range: [40, 70] },
                  { label: "Massa muscular esquelética", value: bioAtual.resultados?.massaMuscularEsqueletica, range: [30, 50] },
                  { label: "Taxa de músculo", value: bioAtual.resultados?.taxaMuscular, range: [30, 50] },
                  { label: "Massa esquelética", value: bioAtual.resultados?.massaEsqueletica, range: [3, 5] },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{item.value || "N/A"}</span>
                    </div>
                    <div className="relative w-full h-6 bg-gradient-to-r from-orange-400 via-green-400 to-teal-600 rounded">
                      <div 
                        className="absolute top-0 h-full w-1 bg-gray-900"
                        style={{ left: `${((item.value || 0) - item.range[0]) / (item.range[1] - item.range[0]) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Baixo</span>
                      <span>Normal</span>
                      <span>Alto</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Análise de Gordura */}
            <Card>
              <CardHeader>
                <CardTitle>Análise de Gordura</CardTitle>
                <CardDescription>Distribuição de gordura corporal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Relação de gordura", value: bioAtual.resultados?.gorduraCorporal, range: [10, 30] },
                  { label: "Massa de gordura subcutânea", value: bioAtual.resultados?.gorduraSubcutanea, range: [5, 20] },
                  { label: "Relação gordura subcutânea", value: bioAtual.resultados?.taxaGorduraSubcutanea, range: [5, 25] },
                  { label: "Gordura visceral", value: bioAtual.resultados?.gorduraVisceral, range: [1, 15] },
                  { label: "Massa livre de gordura", value: bioAtual.resultados?.massaLivreGordura, range: [40, 80] },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{item.value || "N/A"}</span>
                    </div>
                    <div className="relative w-full h-6 bg-gradient-to-r from-orange-400 via-green-400 to-red-600 rounded">
                      <div 
                        className="absolute top-0 h-full w-1 bg-gray-900"
                        style={{ left: `${((item.value || 0) - item.range[0]) / (item.range[1] - item.range[0]) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Baixo</span>
                      <span>Normal</span>
                      <span>Alto</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Avatar de Análise Segmentar */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Segmentar - Massa Muscular</CardTitle>
                <CardDescription>Visualização da distribuição muscular por segmento corporal</CardDescription>
              </CardHeader>
              <CardContent>
                <BodyAvatar
                  segmentalData={{
                    bracoEsquerdo: bioAtual.resultados?.taxaMusculoBracoEsq ? parseFloat(bioAtual.resultados.taxaMusculoBracoEsq) : undefined,
                    bracoDireito: bioAtual.resultados?.taxaMusculoBracoDir ? parseFloat(bioAtual.resultados.taxaMusculoBracoDir) : undefined,
                    pernaEsquerda: bioAtual.resultados?.taxaMusculoPernaEsq ? parseFloat(bioAtual.resultados.taxaMusculoPernaEsq) : undefined,
                    pernaDireita: bioAtual.resultados?.taxaMusculoPernaDir ? parseFloat(bioAtual.resultados.taxaMusculoPernaDir) : undefined,
                    tronco: bioAtual.resultados?.taxaMusculoTronco ? parseFloat(bioAtual.resultados.taxaMusculoTronco) : undefined,
                  }}
                  type="muscle"
                />
              </CardContent>
            </Card>

            {/* Controle de Peso */}
            <Card>
              <CardHeader>
                <CardTitle>Controle de Peso</CardTitle>
                <CardDescription>Metas e ajustes recomendados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Controle de Peso</p>
                    <p className="text-2xl font-bold text-[#2C5AA0]">
                      {bioAtual.resultados?.controlePeso || "N/A"} kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Controle de Gordura</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {bioAtual.resultados?.controleGordura || "N/A"} kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Controle Muscular</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bioAtual.resultados?.controleMuscular || "N/A"} kg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos de Evolução Temporal */}
            {bioimpedancias && bioimpedancias.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal</CardTitle>
                  <CardDescription>Acompanhamento dos indicadores ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico de Peso */}
                    <EvolutionChart
                      data={bioimpedancias.map((bio: any) => ({
                        date: bio.dataAvaliacao,
                        value: bio.resultados?.peso || null,
                      }))}
                      label="Peso"
                      color="#2C5AA0"
                      unit="kg"
                      title="Evolução do Peso Corporal"
                    />

                    {/* Gráfico de IMC */}
                    <EvolutionChart
                      data={bioimpedancias.map((bio: any) => ({
                        date: bio.dataAvaliacao,
                        value: bio.resultados?.imc ? parseFloat(bio.resultados.imc) : null,
                      }))}
                      label="IMC"
                      color="#10B981"
                      unit=""
                      title="Evolução do IMC"
                    />

                    {/* Gráfico de Gordura Corporal */}
                    <EvolutionChart
                      data={bioimpedancias.map((bio: any) => ({
                        date: bio.dataAvaliacao,
                        value: bio.resultados?.percentualGordura ? parseFloat(bio.resultados.percentualGordura) : null,
                      }))}
                      label="Gordura Corporal"
                      color="#F59E0B"
                      unit="%"
                      title="Evolução da Gordura Corporal"
                    />

                    {/* Gráfico de Massa Muscular */}
                    <EvolutionChart
                      data={bioimpedancias.map((bio: any) => ({
                        date: bio.dataAvaliacao,
                        value: bio.resultados?.massaMuscular ? parseFloat(bio.resultados.massaMuscular) : null,
                      }))}
                      label="Massa Muscular"
                      color="#8B5CF6"
                      unit="kg"
                      title="Evolução da Massa Muscular"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de Avaliações */}
            {bioimpedancias && bioimpedancias.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Avaliações</CardTitle>
                  <CardDescription>Selecione uma avaliação para visualizar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bioimpedancias.map((bio: any) => (
                      <button
                        key={bio.id}
                        onClick={() => setSelectedBio(bio)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          selectedBio?.id === bio.id || (!selectedBio && bio.id === bioimpedancias[0].id)
                            ? "border-[#2C5AA0] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {new Date(bio.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-sm text-gray-600">
                              Peso: {bio.resultados?.peso || "N/A"} kg | 
                              IMC: {bio.resultados?.imc || "N/A"}
                            </p>
                          </div>
                          {selectedBio?.id === bio.id || (!selectedBio && bio.id === bioimpedancias[0].id) ? (
                            <div className="w-3 h-3 bg-[#2C5AA0] rounded-full" />
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
