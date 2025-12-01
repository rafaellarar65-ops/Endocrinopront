diff --git a/PacienteDetalhes.tsx b/PacienteDetalhes.tsx
index a5133ef59cf66b8d0a9496dd4898635fbd1cc9d0..fff8027537b8f3995d2a75812508c588586a73bd 100644
--- a/PacienteDetalhes.tsx
+++ b/PacienteDetalhes.tsx
@@ -1,146 +1,327 @@
 import { useAuth } from "@/_core/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { trpc } from "@/lib/trpc";
 import { 
   ArrowLeft, 
   User, 
   Calendar, 
   Phone, 
   Mail,
   Edit,
   FileText,
   Activity,
   TrendingUp,
   Stethoscope,
   Plus,
   Clock,
-  MapPin
+  MapPin,
+  Volume2,
+  Download,
+  Paperclip,
+  ExternalLink
 } from "lucide-react";
 import { useLocation, useRoute } from "wouter";
 import { getLoginUrl } from "@/const";
-import { useState } from "react";
-import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
+import { useMemo, useState } from "react";
+import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
+import { ExameResultadosTable } from "./ExameResultadosTable";
 import { toast } from "sonner";
 import { Textarea } from "@/components/ui/textarea";
+import EvolutionChart from "./EvolutionChart";
+import { montarSeriesEvolucao } from "./examesUtils";
 
 export default function PacienteDetalhes() {
-  const { user, loading: authLoading, isAuthenticated } = useAuth();
+  const { loading: authLoading, isAuthenticated } = useAuth();
   const [, setLocation] = useLocation();
   const [, params] = useRoute("/pacientes/:id");
   const pacienteId = params?.id ? parseInt(params.id) : 0;
 
   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
   const [isConsultaDialogOpen, setIsConsultaDialogOpen] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
+  const [duracoesAudio, setDuracoesAudio] = useState<Record<number, number>>({});
 
   const { data: paciente, isLoading, refetch } = trpc.pacientes.getById.useQuery(
     { id: pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
   const { data: consultas } = trpc.consultas.getByPaciente.useQuery(
     { pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
   const { data: exames } = trpc.exames.getByPaciente.useQuery(
     { pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
+  const seriesEvolucao = useMemo(() => montarSeriesEvolucao(exames ?? []), [exames]);
+
   const { data: bioimpedancias } = trpc.bioimpedancia.getByPaciente.useQuery(
     { pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
   const { data: documentos } = trpc.documentos.getByPaciente.useQuery(
     { pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
   const { data: indicadores } = trpc.indicadores.getByPaciente.useQuery(
     { pacienteId },
     { enabled: isAuthenticated && pacienteId > 0 }
   );
 
+  const timelineEventos = useMemo(() => {
+    const eventos: Array<{
+      data: string;
+      tipo: "consulta" | "exame" | "bioimpedancia";
+      titulo: string;
+      descricao?: string;
+      badge?: string;
+    }> = [];
+
+    consultas?.forEach((consulta) => {
+      const dataReferencia = consulta.dataHora || consulta.createdAt || new Date();
+      const soapPartes = [
+        consulta.anamnese?.queixaPrincipal
+          ? `S: ${consulta.anamnese.queixaPrincipal}`
+          : undefined,
+        consulta.exameFisico?.exameGeral
+          ? `O: ${consulta.exameFisico.exameGeral}`
+          : undefined,
+        consulta.hipotesesDiagnosticas ? `A: ${consulta.hipotesesDiagnosticas}` : undefined,
+        consulta.conduta ? `P: ${consulta.conduta}` : undefined,
+      ].filter(Boolean);
+
+      eventos.push({
+        data: dataReferencia as unknown as string,
+        tipo: "consulta",
+        titulo: `Consulta ${new Date(dataReferencia).toLocaleDateString("pt-BR")}`,
+        descricao: soapPartes.join(" | ") || "Sem notas SOAP registradas.",
+        badge: consulta.status === "concluida" ? "Finalizada" : "Em aberto",
+      });
+
+      if (consulta.conduta) {
+        const texto = consulta.conduta.toLowerCase();
+        if (/inicia|introduz/.test(texto)) {
+          eventos.push({
+            data: dataReferencia as unknown as string,
+            tipo: "consulta",
+            titulo: "Marco: Início de medicação",
+            descricao: consulta.conduta,
+            badge: "Marco",
+          });
+        }
+        if (/aumenta|reduz|ajusta/.test(texto)) {
+          eventos.push({
+            data: dataReferencia as unknown as string,
+            tipo: "consulta",
+            titulo: "Marco: Ajuste de dose",
+            descricao: consulta.conduta,
+            badge: "Dose",
+          });
+        }
+        if (/evento adverso|efeito colateral|reacao/.test(texto)) {
+          eventos.push({
+            data: dataReferencia as unknown as string,
+            tipo: "consulta",
+            titulo: "Evento adverso",
+            descricao: consulta.conduta,
+            badge: "Alerta",
+          });
+        }
+      }
+    });
+
+    exames?.forEach((exame) => {
+      eventos.push({
+        data: exame.dataExame as unknown as string,
+        tipo: "exame",
+        titulo: `Exame ${exame.tipo || "Laboratorial"}`,
+        descricao: `${exame.resultados?.length || 0} resultados registrados`,
+        badge: "Exame",
+      });
+    });
+
+    bioimpedancias?.forEach((bio) => {
+      eventos.push({
+        data: bio.dataAvaliacao as unknown as string,
+        tipo: "bioimpedancia",
+        titulo: "Bioimpedância",
+        descricao: bio.observacoes || "Avaliação corporal registrada",
+        badge: "Composição",
+      });
+    });
+
+    return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
+  }, [bioimpedancias, consultas, exames]);
+
+  const comparacaoExames = useMemo(() => {
+    return seriesEvolucao
+      .map((serie) => {
+        const ultimo = serie.pontos[serie.pontos.length - 1];
+        const penultimo = serie.pontos[serie.pontos.length - 2];
+        if (!ultimo || !penultimo) return null;
+        const delta = ultimo.valor - penultimo.valor;
+        return {
+          parametro: serie.parametro,
+          atual: `${ultimo.valor.toFixed(2)} ${serie.unidadeBase || ""}`,
+          anterior: `${penultimo.valor.toFixed(2)} ${serie.unidadeBase || ""}`,
+          dataAtual: new Date(ultimo.data).toLocaleDateString("pt-BR"),
+          dataAnterior: new Date(penultimo.data).toLocaleDateString("pt-BR"),
+          tendencia: delta > 0 ? "alta" : delta < 0 ? "queda" : "estavel",
+          aviso: serie.avisoUnidade,
+        };
+      })
+      .filter(Boolean);
+  }, [seriesEvolucao]);
+
+  const aderencia = useMemo(() => {
+    if (!consultas || consultas.length === 0) return { percentual: 0, descricao: "Sem consultas registradas" };
+    const concluidas = consultas.filter((c) => c.status === "concluida").length;
+    const percentual = Math.round((concluidas / consultas.length) * 100);
+    return {
+      percentual,
+      descricao: `${concluidas} de ${consultas.length} consultas finalizadas`,
+    };
+  }, [consultas]);
+
+  const pesoData = useMemo(
+    () =>
+      (indicadores || []).map((ind) => ({
+        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
+        value: ind.peso ? ind.peso / 1000 : null,
+      })),
+    [indicadores]
+  );
+
+  const imcData = useMemo(
+    () =>
+      (indicadores || []).map((ind) => ({
+        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
+        value: ind.imc ? ind.imc / 100 : null,
+      })),
+    [indicadores]
+  );
+
+  const glicemiaData = useMemo(
+    () =>
+      (indicadores || []).map((ind) => ({
+        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
+        value: ind.glicemiaJejum ?? null,
+      })),
+    [indicadores]
+  );
+
+  const hba1cData = useMemo(
+    () =>
+      (indicadores || []).map((ind) => ({
+        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
+        value: ind.hemoglobinaGlicada ? ind.hemoglobinaGlicada / 100 : null,
+      })),
+    [indicadores]
+  );
+
+  const paData = useMemo(
+    () =>
+      (indicadores || []).map((ind) => ({
+        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
+        value: ind.pressaoArterialSistolica && ind.pressaoArterialDiastolica
+          ? ind.pressaoArterialSistolica / 10 + ind.pressaoArterialDiastolica / 100
+          : null,
+      })),
+    [indicadores]
+  );
+
   const updateMutation = trpc.pacientes.update.useMutation({
     onSuccess: () => {
       toast.success("Paciente atualizado com sucesso!");
       setIsEditDialogOpen(false);
       refetch();
     },
     onError: (error) => {
       toast.error("Erro ao atualizar paciente: " + error.message);
     },
   });
 
   const createConsultaMutation = trpc.consultas.create.useMutation({
     onSuccess: (consulta) => {
       toast.success("Consulta criada com sucesso!");
       setIsConsultaDialogOpen(false);
       setLocation(`/consulta/${consulta.id}`);
     },
     onError: (error) => {
       toast.error("Erro ao criar consulta: " + error.message);
     },
   });
 
   const [editFormData, setEditFormData] = useState({
     nome: "",
     cpf: "",
     dataNascimento: "",
     sexo: "masculino" as "masculino" | "feminino" | "outro",
     contatoWhatsapp: "",
     email: "",
     telefone: "",
     endereco: "",
     observacoes: "",
   });
 
   // Função para obter data/hora atual no fuso horário de Brasília
   const getDataHoraAtual = () => {
     const now = new Date();
     const offset = -3; // UTC-3 (Brasília)
     const diff = offset * 60 + now.getTimezoneOffset();
     const brasiliaTime = new Date(now.getTime() + diff * 60 * 1000);
-    
+
     const year = brasiliaTime.getFullYear();
     const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
     const day = String(brasiliaTime.getDate()).padStart(2, '0');
     const hours = String(brasiliaTime.getHours()).padStart(2, '0');
     const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
-    
+
     return `${year}-${month}-${day}T${hours}:${minutes}`;
   };
 
+  const formatarDuracao = (duracaoSegundos?: number) => {
+    if (!duracaoSegundos || Number.isNaN(duracaoSegundos)) return "--:--";
+    const minutos = Math.floor(duracaoSegundos / 60);
+    const segundos = Math.floor(duracaoSegundos % 60)
+      .toString()
+      .padStart(2, "0");
+    return `${minutos}:${segundos}`;
+  };
+
   const [consultaFormData, setConsultaFormData] = useState({
     dataHora: getDataHoraAtual(),
     observacoes: "",
   });
 
   const handleEditClick = () => {
     if (paciente) {
       setEditFormData({
         nome: paciente.nome || "",
         cpf: paciente.cpf || "",
         dataNascimento: paciente.dataNascimento 
           ? new Date(paciente.dataNascimento).toISOString().split('T')[0] 
           : "",
         sexo: paciente.sexo || "masculino",
         contatoWhatsapp: paciente.contatoWhatsapp || "",
         email: paciente.email || "",
         telefone: paciente.telefone || "",
         endereco: paciente.endereco || "",
         observacoes: paciente.observacoes || "",
       });
       setIsEditDialogOpen(true);
     }
   };
 
   const handleEditSubmit = (e: React.FormEvent) => {
@@ -271,57 +452,59 @@ export default function PacienteDetalhes() {
               <CardTitle className="text-3xl">{exames?.length || 0}</CardTitle>
             </CardHeader>
           </Card>
           <Card>
             <CardHeader className="pb-3">
               <CardDescription className="flex items-center gap-2">
                 <Activity className="h-4 w-4" />
                 Bioimpedâncias
               </CardDescription>
               <CardTitle className="text-3xl">{bioimpedancias?.length || 0}</CardTitle>
             </CardHeader>
           </Card>
           <Card>
             <CardHeader className="pb-3">
               <CardDescription className="flex items-center gap-2">
                 <FileText className="h-4 w-4" />
                 Documentos
               </CardDescription>
               <CardTitle className="text-3xl">{documentos?.length || 0}</CardTitle>
             </CardHeader>
           </Card>
         </div>
 
         {/* Tabs */}
         <Tabs defaultValue="info" className="space-y-4">
-          <TabsList className="grid w-full grid-cols-6">
+          <TabsList className="grid w-full grid-cols-8">
             <TabsTrigger value="info">Informações</TabsTrigger>
             <TabsTrigger value="consultas">Consultas</TabsTrigger>
             <TabsTrigger value="exames">Exames</TabsTrigger>
+            <TabsTrigger value="audios">Áudios</TabsTrigger>
             <TabsTrigger value="bioimpedancia">Bioimpedância</TabsTrigger>
             <TabsTrigger value="documentos">Documentos</TabsTrigger>
             <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
+            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
           </TabsList>
 
           {/* Aba Informações */}
           <TabsContent value="info">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle>Informações do Paciente</CardTitle>
                     <CardDescription>Dados cadastrais e informações de contato</CardDescription>
                   </div>
                   {!isEditMode ? (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setEditFormData({
                           nome: paciente.nome,
                           cpf: paciente.cpf || "",
                           dataNascimento: paciente.dataNascimento
                             ? new Date(paciente.dataNascimento).toISOString().split('T')[0]
                             : "",
                           sexo: (paciente.sexo as "masculino" | "feminino" | "outro") || "masculino",
                           contatoWhatsapp: paciente.contatoWhatsapp || "",
                           email: paciente.email || "",
@@ -625,97 +808,259 @@ export default function PacienteDetalhes() {
                             </div>
                             <Badge variant={
                               consulta.status === 'concluida' ? 'default' :
                               consulta.status === 'em_andamento' ? 'secondary' :
                               consulta.status === 'cancelada' ? 'destructive' : 'outline'
                             }>
                               {consulta.status === 'concluida' ? 'Concluída' :
                                consulta.status === 'em_andamento' ? 'Em Andamento' :
                                consulta.status === 'cancelada' ? 'Cancelada' : 'Agendada'}
                             </Badge>
                           </div>
                         </CardHeader>
                         {consulta.observacoes && (
                           <CardContent>
                             <p className="text-sm text-gray-600 line-clamp-2">{consulta.observacoes}</p>
                           </CardContent>
                         )}
                       </Card>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
+          {/* Aba Áudios */}
+          <TabsContent value="audios">
+            <Card>
+              <CardHeader>
+                <div className="flex items-center justify-between">
+                  <div>
+                    <CardTitle>Áudios das Consultas</CardTitle>
+                    <CardDescription>Reproduza ou baixe os áudios associados às consultas</CardDescription>
+                  </div>
+                  <Badge variant="secondary" className="flex items-center gap-1">
+                    <Volume2 className="h-4 w-4" />
+                    {consultas?.filter((c) => c.audioUrl)?.length || 0} áudios
+                  </Badge>
+                </div>
+              </CardHeader>
+              <CardContent>
+                {!consultas || consultas.length === 0 ? (
+                  <div className="text-center text-gray-500 py-10">
+                    Nenhuma consulta encontrada para este paciente.
+                  </div>
+                ) : (
+                  (() => {
+                    const consultasComAudio = consultas
+                      .filter((consulta) => !!consulta.audioUrl)
+                      .sort(
+                        (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
+                      );
+
+                    if (consultasComAudio.length === 0) {
+                      return (
+                        <div className="text-center text-gray-500 py-10">
+                          Nenhum áudio disponível nas consultas registradas.
+                        </div>
+                      );
+                    }
+
+                    return (
+                      <div className="space-y-4">
+                        {consultasComAudio.map((consulta) => (
+                          <Card key={consulta.id} className="border border-gray-200">
+                            <CardHeader className="pb-2">
+                              <div className="flex items-center justify-between">
+                                <div>
+                                  <CardTitle className="text-base">
+                                    Consulta em {new Date(consulta.dataHora).toLocaleDateString("pt-BR")}
+                                  </CardTitle>
+                                  <CardDescription>
+                                    {new Date(consulta.dataHora).toLocaleTimeString("pt-BR", {
+                                      hour: "2-digit",
+                                      minute: "2-digit",
+                                    })}
+                                    {consulta.status ? ` • ${consulta.status}` : ""}
+                                    {duracoesAudio[consulta.id] &&
+                                      ` • Duração: ${formatarDuracao(duracoesAudio[consulta.id])}`}
+                                  </CardDescription>
+                                </div>
+                                <Badge variant="outline">Áudio</Badge>
+                              </div>
+                            </CardHeader>
+                            <CardContent className="space-y-3">
+                              <audio
+                                controls
+                                className="w-full"
+                                src={consulta.audioUrl || undefined}
+                                onLoadedMetadata={(event) => {
+                                  if (!Number.isFinite(event.currentTarget.duration)) return;
+                                  setDuracoesAudio((prev) => ({
+                                    ...prev,
+                                    [consulta.id]: event.currentTarget.duration,
+                                  }));
+                                }}
+                              />
+                              <div className="flex items-center justify-between text-xs text-gray-600">
+                                <span className="flex items-center gap-2">
+                                  <Volume2 className="h-4 w-4" />
+                                  Arquivo salvo no prontuário
+                                </span>
+                                <Button
+                                  variant="outline"
+                                  size="sm"
+                                  className="flex items-center gap-2"
+                                  onClick={() => consulta.audioUrl && window.open(consulta.audioUrl, "_blank")}
+                                >
+                                  <Download className="h-4 w-4" />
+                                  Baixar
+                                </Button>
+                              </div>
+                            </CardContent>
+                          </Card>
+                        ))}
+                      </div>
+                    );
+                  })()
+                )}
+              </CardContent>
+            </Card>
+          </TabsContent>
+
           {/* Aba Exames */}
           <TabsContent value="exames">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle>Exames Laboratoriais</CardTitle>
                     <CardDescription>Histórico de exames e resultados</CardDescription>
                   </div>
                   <Button>
                     <Plus className="h-4 w-4 mr-2" />
                     Adicionar Exame
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 {!exames || exames.length === 0 ? (
                   <div className="text-center py-12">
                     <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                     <p className="text-gray-600 mb-4">Nenhum exame registrado</p>
                     <Button>
                       <Plus className="h-4 w-4 mr-2" />
                       Adicionar Primeiro Exame
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {exames.map((exame) => (
                       <Card key={exame.id} className="hover:shadow-md transition-shadow">
                         <CardHeader>
                           <div className="flex items-start justify-between">
                             <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                                 <FileText className="h-5 w-5 text-cyan-600" />
                               </div>
                               <div>
                                 <CardTitle className="text-base">{exame.tipo || 'Exame'}</CardTitle>
                                 <CardDescription>
                                   {new Date(exame.dataExame).toLocaleDateString('pt-BR')}
                                   {exame.laboratorio && ` • ${exame.laboratorio}`}
                                 </CardDescription>
                               </div>
                             </div>
                           </div>
                         </CardHeader>
+                        {(exame.fileName || exame.pdfUrl || exame.imagemUrl) && (
+                          <div className="px-6 -mt-3 flex items-center gap-2 text-xs text-gray-600">
+                            <Paperclip className="h-4 w-4" />
+                            <span className="truncate">{exame.fileName || "Arquivo anexado"}</span>
+                            {(exame.pdfUrl || exame.imagemUrl) && (
+                              <Button
+                                variant="link"
+                                size="sm"
+                                className="px-0 h-auto"
+                                onClick={() => window.open(exame.pdfUrl || exame.imagemUrl, "_blank")}
+                              >
+                                <ExternalLink className="h-4 w-4 mr-1" />
+                                Abrir
+                              </Button>
+                            )}
+                          </div>
+                        )}
+                        {Array.isArray(exame.resultados) && exame.resultados.length > 0 && (
+                          <ExameResultadosTable resultados={exame.resultados} />
+                        )}
                       </Card>
                     ))}
+                    {seriesEvolucao.length > 0 && (
+                      <div className="space-y-3">
+                        <div className="flex items-center justify-between">
+                          <h4 className="text-sm font-semibold text-gray-800">
+                            Evolução de parâmetros (exige ao menos 2 registros)
+                          </h4>
+                          <Badge variant="secondary">{seriesEvolucao.length} parâmetros</Badge>
+                        </div>
+                        <div className="grid md:grid-cols-2 gap-4">
+                          {seriesEvolucao.slice(0, 4).map((serie, idx) => {
+                            const ultimo = serie.pontos[serie.pontos.length - 1];
+                            const cores = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"];
+                            const cor = cores[idx % cores.length];
+
+                            return (
+                              <Card key={serie.id} className="border border-gray-100 shadow-sm">
+                                <CardHeader className="pb-2">
+                                  <CardTitle className="text-sm">{serie.parametro}</CardTitle>
+                                  {serie.unidade && <CardDescription>Unidade: {serie.unidade}</CardDescription>}
+                                </CardHeader>
+                                <CardContent>
+                                  <EvolutionChart
+                                    data={serie.pontos.map((p) => ({ date: p.data, value: p.valor }))}
+                                    label={serie.parametro}
+                                    color={cor}
+                                    unit={serie.unidadeBase || serie.unidade || ""}
+                                    title={`Evolução de ${serie.parametro}`}
+                                    warning={serie.avisoUnidade}
+                                  />
+                                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
+                                    <TrendingUp className="h-4 w-4" />
+                                    <span>
+                                      Último valor: <strong>{ultimo.valor}</strong>
+                                      {serie.unidadeBase ? ` ${serie.unidadeBase}` : ""} em{" "}
+                                      {new Date(ultimo.data).toLocaleDateString("pt-BR")}
+                                    </span>
+                                  </div>
+                                </CardContent>
+                              </Card>
+                            );
+                          })}
+                        </div>
+                      </div>
+                    )}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Aba Bioimpedância */}
           <TabsContent value="bioimpedancia">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle>Bioimpedância</CardTitle>
                     <CardDescription>Histórico de avaliações de composição corporal</CardDescription>
                   </div>
                   <Button>
                     <Plus className="h-4 w-4 mr-2" />
                     Adicionar Bioimpedância
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 {!bioimpedancias || bioimpedancias.length === 0 ? (
                   <div className="text-center py-12">
                     <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
@@ -833,50 +1178,159 @@ export default function PacienteDetalhes() {
                         {ind.peso && (
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <p className="text-sm text-gray-600">Peso</p>
                             <p className="text-2xl font-bold">{(ind.peso / 1000).toFixed(1)} kg</p>
                           </div>
                         )}
                         {ind.altura && (
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <p className="text-sm text-gray-600">Altura</p>
                             <p className="text-2xl font-bold">{(ind.altura / 100).toFixed(2)} m</p>
                           </div>
                         )}
                         {ind.imc && (
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <p className="text-sm text-gray-600">IMC</p>
                             <p className="text-2xl font-bold">{(ind.imc / 100).toFixed(1)}</p>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
+
+          {/* Aba Evolução e Acompanhamento */}
+          <TabsContent value="evolucao">
+            <div className="space-y-6">
+              <Card>
+                <CardHeader>
+                  <div className="flex items-center justify-between">
+                    <div>
+                      <CardTitle>Timeline de evolução</CardTitle>
+                      <CardDescription>Consultas, exames, bioimpedância e marcos clínicos</CardDescription>
+                    </div>
+                    <Badge variant="outline">Aderência {aderencia.percentual}%</Badge>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  {timelineEventos.length === 0 ? (
+                    <div className="text-center py-8 text-gray-500">Sem eventos para exibir</div>
+                  ) : (
+                    <div className="space-y-4">
+                      {timelineEventos.map((evento, index) => (
+                        <div key={`${evento.tipo}-${index}`} className="flex gap-3 items-start">
+                          <div className="w-20 text-xs text-gray-500 pt-1">
+                            {new Date(evento.data).toLocaleDateString("pt-BR")}
+                          </div>
+                          <div className="flex-1 border-l pl-4 pb-4">
+                            <div className="flex items-center gap-2">
+                              <Badge variant="secondary">{evento.titulo}</Badge>
+                              {evento.badge && <Badge variant="outline">{evento.badge}</Badge>}
+                            </div>
+                            <p className="text-sm text-gray-700 mt-1">{evento.descricao}</p>
+                          </div>
+                        </div>
+                      ))}
+                    </div>
+                  )}
+                </CardContent>
+              </Card>
+
+              <Card>
+                <CardHeader>
+                  <CardTitle>Gráficos de evolução</CardTitle>
+                  <CardDescription>Peso, IMC, glicemia, HbA1c e pressão arterial</CardDescription>
+                </CardHeader>
+                <CardContent>
+                  <div className="grid lg:grid-cols-2 gap-6">
+                    <EvolutionChart data={pesoData} label="Peso" color="#2563eb" unit="kg" title="Peso" />
+                    <EvolutionChart data={imcData} label="IMC" color="#7c3aed" unit="kg/m²" title="IMC" />
+                    <EvolutionChart data={glicemiaData} label="Glicemia" color="#f59e0b" unit="mg/dL" title="Glicemia de Jejum" />
+                    <EvolutionChart data={hba1cData} label="HbA1c" color="#ef4444" unit="%" title="Hemoglobina Glicada" />
+                    <EvolutionChart data={paData} label="PA" color="#10b981" unit="mmHg" title="Pressão Arterial" />
+                  </div>
+                </CardContent>
+              </Card>
+
+              <Card>
+                <CardHeader>
+                  <CardTitle>Comparação de exames recentes</CardTitle>
+                  <CardDescription>Diferenças entre os dois últimos pontos de cada parâmetro</CardDescription>
+                </CardHeader>
+                <CardContent className="space-y-3">
+                  {(!comparacaoExames || comparacaoExames.length === 0) && (
+                    <div className="text-sm text-gray-500">Sem séries suficientes para comparar.</div>
+                  )}
+                  {comparacaoExames?.map((comp, idx) => (
+                    <div key={`${comp?.parametro}-${idx}`} className="p-4 rounded-lg border bg-white">
+                      <div className="flex items-center justify-between">
+                        <div className="font-semibold text-gray-800">{comp?.parametro}</div>
+                        {comp?.tendencia === "alta" && <Badge variant="secondary">Em alta</Badge>}
+                        {comp?.tendencia === "queda" && <Badge variant="outline">Em queda</Badge>}
+                        {comp?.tendencia === "estavel" && <Badge variant="outline">Estável</Badge>}
+                      </div>
+                      <p className="text-sm text-gray-700 mt-1">
+                        Último: {comp?.atual} ({comp?.dataAtual}) • Anterior: {comp?.anterior} ({comp?.dataAnterior})
+                      </p>
+                      {comp?.aviso && (
+                        <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded px-2 py-1">
+                          {comp.aviso}
+                        </p>
+                      )}
+                    </div>
+                  ))}
+                </CardContent>
+              </Card>
+
+              <Card>
+                <CardHeader>
+                  <CardTitle>Indicadores de aderência</CardTitle>
+                  <CardDescription>Visão rápida de acompanhamento longitudinal</CardDescription>
+                </CardHeader>
+                <CardContent className="grid md:grid-cols-3 gap-4">
+                  <div className="p-4 rounded-lg border bg-white">
+                    <p className="text-sm text-gray-600">Consultas finalizadas</p>
+                    <p className="text-3xl font-bold">{aderencia.percentual}%</p>
+                    <p className="text-xs text-gray-500">{aderencia.descricao}</p>
+                  </div>
+                  <div className="p-4 rounded-lg border bg-white">
+                    <p className="text-sm text-gray-600">Exames registrados</p>
+                    <p className="text-3xl font-bold">{exames?.length || 0}</p>
+                    <p className="text-xs text-gray-500">Pacotes utilizados em séries evolutivas</p>
+                  </div>
+                  <div className="p-4 rounded-lg border bg-white">
+                    <p className="text-sm text-gray-600">Bioimpedâncias</p>
+                    <p className="text-3xl font-bold">{bioimpedancias?.length || 0}</p>
+                    <p className="text-xs text-gray-500">Consideradas nos marcos do paciente</p>
+                  </div>
+                </CardContent>
+              </Card>
+            </div>
+          </TabsContent>
         </Tabs>
       </main>
 
       {/* Edit Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Editar Paciente</DialogTitle>
             <DialogDescription>Atualize os dados do paciente</DialogDescription>
           </DialogHeader>
           <form onSubmit={handleEditSubmit}>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="edit-nome">Nome Completo *</Label>
                 <Input
                   id="edit-nome"
                   value={editFormData.nome}
                   onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                   required
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="edit-cpf">CPF</Label>
