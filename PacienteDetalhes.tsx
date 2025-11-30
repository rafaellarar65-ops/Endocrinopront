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
  MapPin,
  Volume2,
  Download,
  Paperclip,
  ExternalLink
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { getLoginUrl } from "@/const";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExameResultadosTable } from "./ExameResultadosTable";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import EvolutionChart from "./EvolutionChart";
import { montarSeriesEvolucao } from "./examesUtils";

export default function PacienteDetalhes() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pacientes/:id");
  const pacienteId = params?.id ? parseInt(params.id) : 0;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConsultaDialogOpen, setIsConsultaDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const seriesEvolucao = useMemo(() => montarSeriesEvolucao(exames ?? []), [exames]);

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
    
    const year = brasiliaTime.getFullYear();
    const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
    const day = String(brasiliaTime.getDate()).padStart(2, '0');
    const hours = String(brasiliaTime.getHours()).padStart(2, '0');
    const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
    e.preventDefault();
    updateMutation.mutate({
      id: pacienteId,
      ...editFormData,
      dataNascimento: editFormData.dataNascimento ? new Date(editFormData.dataNascimento) : undefined,
    });
  };

  const handleNovaConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    createConsultaMutation.mutate({
      pacienteId,
      dataHora: consultaFormData.dataHora ? new Date(consultaFormData.dataHora) : new Date(),
      observacoes: consultaFormData.observacoes || undefined,
      status: "em_andamento",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Paciente não encontrado</p>
            <Button onClick={() => setLocation("/pacientes")}>
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calcularIdade = (dataNascimento: Date | null) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const idade = calcularIdade(paciente.dataNascimento);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/pacientes")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
                    {idade && <span>•</span>}
                    {idade && <span>{idade} anos</span>}
                    {paciente.sexo && <span>•</span>}
                    {paciente.sexo && <span className="capitalize">{paciente.sexo}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={() => setIsConsultaDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Consulta
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Consultas
              </CardDescription>
              <CardTitle className="text-3xl">{consultas?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exames
              </CardDescription>
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="audios">Áudios</TabsTrigger>
            <TabsTrigger value="bioimpedancia">Bioimpedância</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
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
                          telefone: paciente.telefone || "",
                          endereco: paciente.endereco || "",
                          observacoes: paciente.observacoes || "",
                        });
                        setIsEditMode(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditMode(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({
                            id: pacienteId,
                            ...editFormData,
                            dataNascimento: editFormData.dataNascimento
                              ? new Date(editFormData.dataNascimento)
                              : undefined,
                          });
                          setIsEditMode(false);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditMode ? (
                  /* Modo Visualização */
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-3">Dados Pessoais</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-600">Nome Completo</p>
                              <p className="font-medium">{paciente.nome}</p>
                            </div>
                          </div>
                          {paciente.cpf && (
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">CPF</p>
                                <p className="font-medium">{paciente.cpf}</p>
                              </div>
                            </div>
                          )}
                          {paciente.dataNascimento && (
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Data de Nascimento</p>
                                <p className="font-medium">
                                  {new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')}
                                  {idade && ` (${idade} anos)`}
                                </p>
                              </div>
                            </div>
                          )}
                          {paciente.sexo && (
                            <div className="flex items-start gap-3">
                              <User className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Sexo</p>
                                <p className="font-medium capitalize">{paciente.sexo}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-3">Contato</h3>
                        <div className="space-y-3">
                          {paciente.email && (
                            <div className="flex items-start gap-3">
                              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">E-mail</p>
                                <p className="font-medium">{paciente.email}</p>
                              </div>
                            </div>
                          )}
                          {paciente.telefone && (
                            <div className="flex items-start gap-3">
                              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Telefone</p>
                                <p className="font-medium">{paciente.telefone}</p>
                              </div>
                            </div>
                          )}
                          {paciente.contatoWhatsapp && (
                            <div className="flex items-start gap-3">
                              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">WhatsApp</p>
                                <p className="font-medium">{paciente.contatoWhatsapp}</p>
                              </div>
                            </div>
                          )}
                          {paciente.endereco && (
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-600">Endereço</p>
                                <p className="font-medium">{paciente.endereco}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {paciente.observacoes && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">Observações</h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{paciente.observacoes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Modo Edição */
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-nome">Nome Completo *</Label>
                          <Input
                            id="edit-nome"
                            value={editFormData.nome}
                            onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-cpf">CPF</Label>
                          <Input
                            id="edit-cpf"
                            value={editFormData.cpf}
                            onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-dataNascimento">Data de Nascimento</Label>
                          <Input
                            id="edit-dataNascimento"
                            type="date"
                            value={editFormData.dataNascimento}
                            onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-sexo">Sexo</Label>
                          <Select
                            value={editFormData.sexo}
                            onValueChange={(value: "masculino" | "feminino" | "outro") =>
                              setEditFormData({ ...editFormData, sexo: value })
                            }
                          >
                            <SelectTrigger id="edit-sexo">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-email">E-mail</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-telefone">Telefone</Label>
                          <Input
                            id="edit-telefone"
                            value={editFormData.telefone}
                            onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                            placeholder="(00) 0000-0000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                          <Input
                            id="edit-whatsapp"
                            value={editFormData.contatoWhatsapp}
                            onChange={(e) => setEditFormData({ ...editFormData, contatoWhatsapp: e.target.value })}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-endereco">Endereço</Label>
                          <Input
                            id="edit-endereco"
                            value={editFormData.endereco}
                            onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                            placeholder="Rua, número, bairro, cidade"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-observacoes">Observações</Label>
                      <Textarea
                        id="edit-observacoes"
                        value={editFormData.observacoes}
                        onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                        placeholder="Observações sobre o paciente..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Consultas */}
          <TabsContent value="consultas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Consultas</CardTitle>
                    <CardDescription>Todas as consultas realizadas com este paciente</CardDescription>
                  </div>
                  <Button onClick={() => setIsConsultaDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!consultas || consultas.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhuma consulta registrada</p>
                    <Button onClick={() => setIsConsultaDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Consulta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultas.map((consulta) => (
                      <Card 
                        key={consulta.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/consulta/${consulta.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  Consulta - {new Date(consulta.dataHora).toLocaleDateString('pt-BR')}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(consulta.dataHora).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </CardDescription>
                              </div>
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

          {/* Aba Áudios */}
          <TabsContent value="audios">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Áudios das Consultas</CardTitle>
                    <CardDescription>Reproduza ou baixe os áudios associados às consultas</CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Volume2 className="h-4 w-4" />
                    {consultas?.filter((c) => c.audioUrl)?.length || 0} áudios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!consultas || consultas.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    Nenhuma consulta encontrada para este paciente.
                  </div>
                ) : (
                  (() => {
                    const consultasComAudio = consultas
                      .filter((consulta) => !!consulta.audioUrl)
                      .sort(
                        (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
                      );

                    if (consultasComAudio.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-10">
                          Nenhum áudio disponível nas consultas registradas.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {consultasComAudio.map((consulta) => (
                          <Card key={consulta.id} className="border border-gray-200">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">
                                    Consulta em {new Date(consulta.dataHora).toLocaleDateString("pt-BR")}
                                  </CardTitle>
                                  <CardDescription>
                                    {new Date(consulta.dataHora).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {consulta.status ? ` • ${consulta.status}` : ""}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline">Áudio</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <audio controls className="w-full" src={consulta.audioUrl || undefined} />
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="flex items-center gap-2">
                                  <Volume2 className="h-4 w-4" />
                                  Arquivo salvo no prontuário
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => consulta.audioUrl && window.open(consulta.audioUrl, "_blank")}
                                >
                                  <Download className="h-4 w-4" />
                                  Baixar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                        {(exame.fileName || exame.pdfUrl || exame.imagemUrl) && (
                          <div className="px-6 -mt-3 flex items-center gap-2 text-xs text-gray-600">
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate">{exame.fileName || "Arquivo anexado"}</span>
                            {(exame.pdfUrl || exame.imagemUrl) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="px-0 h-auto"
                                onClick={() => window.open(exame.pdfUrl || exame.imagemUrl, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Abrir
                              </Button>
                            )}
                          </div>
                        )}
                        {Array.isArray(exame.resultados) && exame.resultados.length > 0 && (
                          <ExameResultadosTable resultados={exame.resultados} />
                        )}
                      </Card>
                    ))}
                    {seriesEvolucao.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-800">
                            Evolução de parâmetros (exige ao menos 2 registros)
                          </h4>
                          <Badge variant="secondary">{seriesEvolucao.length} parâmetros</Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          {seriesEvolucao.slice(0, 4).map((serie, idx) => {
                            const ultimo = serie.pontos[serie.pontos.length - 1];
                            const cores = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"];
                            const cor = cores[idx % cores.length];

                            return (
                              <Card key={serie.id} className="border border-gray-100 shadow-sm">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">{serie.parametro}</CardTitle>
                                  {serie.unidade && <CardDescription>Unidade: {serie.unidade}</CardDescription>}
                                </CardHeader>
                                <CardContent>
                                  <EvolutionChart
                                    data={serie.pontos.map((p) => ({ date: p.data, value: p.valor }))}
                                    label={serie.parametro}
                                    color={cor}
                                    unit={serie.unidade || ""}
                                    title={`Evolução de ${serie.parametro}`}
                                  />
                                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>
                                      Último valor: <strong>{ultimo.valor}</strong>
                                      {serie.unidade ? ` ${serie.unidade}` : ""} em{" "}
                                      {new Date(ultimo.data).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                    <p className="text-gray-600 mb-4">Nenhuma bioimpedância registrada</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Bioimpedância
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bioimpedancias.map((bio) => (
                      <Card key={bio.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  Bioimpedância - {new Date(bio.dataAvaliacao).toLocaleDateString('pt-BR')}
                                </CardTitle>
                                {bio.observacoes && (
                                  <CardDescription className="line-clamp-1">{bio.observacoes}</CardDescription>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documentos</CardTitle>
                    <CardDescription>Atestados, relatórios, laudos e encaminhamentos</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Documento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!documentos || documentos.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum documento gerado</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Documento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documentos.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-teal-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{doc.titulo}</CardTitle>
                                <CardDescription>
                                  {doc.tipo.charAt(0).toUpperCase() + doc.tipo.slice(1)} • 
                                  {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={doc.status === 'finalizado' ? 'default' : 'secondary'}>
                              {doc.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Indicadores */}
          <TabsContent value="indicadores">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores Metabólicos</CardTitle>
                <CardDescription>Dashboard de evolução dos indicadores de saúde</CardDescription>
              </CardHeader>
              <CardContent>
                {!indicadores || indicadores.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum indicador registrado ainda</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Os indicadores serão gerados automaticamente a partir de consultas, exames e bioimpedâncias
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {indicadores.slice(0, 1).map((ind) => (
                      <div key={ind.id} className="space-y-4">
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
                  <Input
                    id="edit-cpf"
                    value={editFormData.cpf}
                    onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="edit-dataNascimento"
                    type="date"
                    value={editFormData.dataNascimento}
                    onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-sexo">Sexo</Label>
                <Select value={editFormData.sexo} onValueChange={(value: "masculino" | "feminino" | "outro") => setEditFormData({ ...editFormData, sexo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={editFormData.telefone}
                    onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={editFormData.contatoWhatsapp}
                  onChange={(e) => setEditFormData({ ...editFormData, contatoWhatsapp: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={editFormData.endereco}
                  onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  value={editFormData.observacoes}
                  onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nova Consulta Dialog */}
      <Dialog 
        open={isConsultaDialogOpen} 
        onOpenChange={(open) => {
          setIsConsultaDialogOpen(open);
          if (open) {
            // Resetar data/hora para o momento atual ao abrir o dialog
            setConsultaFormData({
              dataHora: getDataHoraAtual(),
              observacoes: "",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Consulta</DialogTitle>
            <DialogDescription>Iniciar uma nova consulta para {paciente.nome}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNovaConsulta}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="consulta-dataHora">Data e Hora</Label>
                <Input
                  id="consulta-dataHora"
                  type="datetime-local"
                  value={consultaFormData.dataHora}
                  onChange={(e) => setConsultaFormData({ ...consultaFormData, dataHora: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="consulta-observacoes">Observações Iniciais</Label>
                <Textarea
                  id="consulta-observacoes"
                  value={consultaFormData.observacoes}
                  onChange={(e) => setConsultaFormData({ ...consultaFormData, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Motivo da consulta, queixas iniciais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConsultaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createConsultaMutation.isPending}>
                {createConsultaMutation.isPending ? "Criando..." : "Iniciar Consulta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
