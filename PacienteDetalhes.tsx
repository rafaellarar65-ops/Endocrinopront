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
  ExternalLink,
  Send,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExameResultadosTable } from "./ExameResultadosTable";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import EvolutionChart from "./EvolutionChart";
import { montarSeriesEvolucao } from "./examesUtils";
import { gerarDashboardMetabolico, gerarPlanoDual, PlanoTemplate, PlanoVersao } from "./shared/pendenciasEmFoco";

const DIA_EM_MS = 24 * 60 * 60 * 1000;

const montarPlanoComoMarkdown = (versao: PlanoVersao) => {
  const secoes = versao.secoes
    .map((secao) => `### ${secao.titulo}\n${secao.conteudo}`)
    .join("\n\n");

  const checklist = versao.checklist?.length
    ? `\n\n**Checklist de aderência**\n- ${versao.checklist.join("\n- ")}`
    : "";

  const metas = versao.metasSMART?.length
    ? `\n\n**Metas SMART**\n- ${versao.metasSMART.join("\n- ")}`
    : "";

  return `${secoes}${checklist}${metas}`;
};

const PLANO_TEMPLATES: PlanoTemplate[] = [
  {
    condicao: "Diabetes Mellitus tipo 2",
    blocos: [
      { titulo: "Diagnóstico", conteudo: "DM2 com controle subótimo, HbA1c atual {{hba1c}}" },
      { titulo: "Metas", conteudo: "{{nome}} com objetivo de HbA1c < 7% e peso saudável" },
      { titulo: "Conduta", conteudo: "Ajustar metformina e reforçar contagem de carboidratos" },
      { titulo: "MEV", conteudo: "Plano alimentar com redução de açúcares simples e atividade física 150min/sem" },
    ],
    placeholders: { hba1c: "7,8%" },
  },
  {
    condicao: "Obesidade",
    blocos: [
      { titulo: "Diagnóstico", conteudo: "Obesidade grau I, IMC atual {{imc}}" },
      { titulo: "Metas", conteudo: "Redução ponderal progressiva e melhora de composição corporal" },
      { titulo: "Conduta", conteudo: "Reforçar déficit calórico moderado e monitorar adesão semanal" },
      { titulo: "Ferramentas", conteudo: "Apps de diário alimentar e lembretes de hidratação" },
    ],
    placeholders: { imc: "32" },
  },
  {
    condicao: "SOP",
    blocos: [
      { titulo: "Diagnóstico", conteudo: "SOP com queixas de irregularidade menstrual e resistência insulínica" },
      { titulo: "Metas", conteudo: "Regular ciclos e otimizar perfil metabólico" },
      { titulo: "Conduta", conteudo: "Avaliar metformina e orientar exercícios resistidos" },
      { titulo: "Seguimento", conteudo: "Revisão em 12 semanas com exames hormonais" },
    ],
  },
];

export default function PacienteDetalhes() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pacientes/:id");
  const pacienteId = params?.id ? parseInt(params.id) : 0;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConsultaDialogOpen, setIsConsultaDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [duracoesAudio, setDuracoesAudio] = useState<Record<number, number>>({});

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

  const planoTemplates: PlanoTemplate[] = PLANO_TEMPLATES;

  const [templateSelecionado, setTemplateSelecionado] = useState(planoTemplates[0].condicao);
  const [metasPlano, setMetasPlano] = useState<string[]>(["HbA1c < 7%", "Perder 5% do peso em 90 dias"]);
  const [novaMeta, setNovaMeta] = useState("");
  const [versaoPlano, setVersaoPlano] = useState<"medico" | "paciente">("medico");
  const [planoTexto, setPlanoTexto] = useState("");
  const [historicoPlanos, setHistoricoPlanos] = useState<
    Array<{ id: number; status: "rascunho" | "finalizado"; versao: "medico" | "paciente"; emitidoEm: string; canal?: string; template: string; resumo: string }>
  >([
    {
      id: 1,
      status: "finalizado",
      versao: "paciente",
      emitidoEm: new Date().toISOString(),
      canal: "WhatsApp",
      template: "Diabetes Mellitus tipo 2",
      resumo: "Plano enviado ao paciente com metas e checklist de adesão.",
    },
  ]);

  const [tiposTimeline, setTiposTimeline] = useState<Array<"consulta" | "exame" | "bioimpedancia">>([
    "consulta",
    "exame",
    "bioimpedancia",
  ]);
  const [periodoTimeline, setPeriodoTimeline] = useState<number | null>(null);

  const timelineEventos = useMemo(() => {
    const eventos: Array<{
      data: string;
      tipo: "consulta" | "exame" | "bioimpedancia";
      titulo: string;
      descricao?: string;
      badge?: string;
    }> = [];

    consultas?.forEach((consulta) => {
      const dataReferencia = consulta.dataHora || consulta.createdAt || new Date();
      const soapPartes = [
        consulta.anamnese?.queixaPrincipal
          ? `S: ${consulta.anamnese.queixaPrincipal}`
          : undefined,
        consulta.exameFisico?.exameGeral
          ? `O: ${consulta.exameFisico.exameGeral}`
          : undefined,
        consulta.hipotesesDiagnosticas ? `A: ${consulta.hipotesesDiagnosticas}` : undefined,
        consulta.conduta ? `P: ${consulta.conduta}` : undefined,
      ].filter(Boolean);

      eventos.push({
        data: dataReferencia as unknown as string,
        tipo: "consulta",
        titulo: `Consulta ${new Date(dataReferencia).toLocaleDateString("pt-BR")}`,
        descricao: soapPartes.join(" | ") || "Sem notas SOAP registradas.",
        badge: consulta.status === "concluida" ? "Finalizada" : "Em aberto",
      });

      if (consulta.conduta) {
        const texto = consulta.conduta.toLowerCase();
        if (/inicia|introduz/.test(texto)) {
          eventos.push({
            data: dataReferencia as unknown as string,
            tipo: "consulta",
            titulo: "Marco: Início de medicação",
            descricao: consulta.conduta,
            badge: "Marco",
          });
        }
        if (/aumenta|reduz|ajusta/.test(texto)) {
          eventos.push({
            data: dataReferencia as unknown as string,
            tipo: "consulta",
            titulo: "Marco: Ajuste de dose",
            descricao: consulta.conduta,
            badge: "Dose",
          });
        }
        if (/evento adverso|efeito colateral|reacao/.test(texto)) {
          eventos.push({
            data: dataReferencia as unknown as string,
            tipo: "consulta",
            titulo: "Evento adverso",
            descricao: consulta.conduta,
            badge: "Alerta",
          });
        }
      }
    });

    exames?.forEach((exame) => {
      eventos.push({
        data: exame.dataExame as unknown as string,
        tipo: "exame",
        titulo: `Exame ${exame.tipo || "Laboratorial"}`,
        descricao: `${exame.resultados?.length || 0} resultados registrados`,
        badge: "Exame",
      });
    });

    bioimpedancias?.forEach((bio) => {
      eventos.push({
        data: bio.dataAvaliacao as unknown as string,
        tipo: "bioimpedancia",
        titulo: "Bioimpedância",
        descricao: bio.observacoes || "Avaliação corporal registrada",
        badge: "Composição",
      });
    });

    return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [bioimpedancias, consultas, exames]);

  const templateAtivo = useMemo(
    () => planoTemplates.find((tpl) => tpl.condicao === templateSelecionado) ?? planoTemplates[0],
    [planoTemplates, templateSelecionado]
  );

  const planoGerado = useMemo(
    () =>
      gerarPlanoDual(templateAtivo, {
        nome: paciente?.nome || "Paciente",
        metas: metasPlano,
      }),
    [metasPlano, paciente?.nome, templateAtivo]
  );

  useEffect(() => {
    const versaoSelecionada = versaoPlano === "medico" ? planoGerado.medico : planoGerado.paciente;
    setPlanoTexto(montarPlanoComoMarkdown(versaoSelecionada));
  }, [planoGerado, versaoPlano]);

  const dashboardMetabolico = useMemo(() => {
    const examesNormalizados = (exames || [])
      .map((exame) => ({
        id: exame.id,
        data: exame.dataExame ? new Date(exame.dataExame) : new Date(),
        tipo: exame.tipo || "Laboratorial",
        resultados: (exame.resultados || [])
          .map((resultado) => ({
            parametro: resultado.parametro || resultado.nome || "Parâmetro",
            valor: Number(resultado.valor),
            unidade: resultado.unidade || "",
          }))
          .filter((resultado) => Number.isFinite(resultado.valor)),
      }))
      .filter((exame) => exame.resultados.length > 0);

    const bioDados = (indicadores || [])
      .map((ind) => ({
        id: ind.id || `${ind.dataAvaliacao || ind.dataReferencia || "indicador"}`,
        data: new Date(ind.dataAvaliacao || ind.dataReferencia || new Date()),
        peso: ind.peso ? ind.peso / 1000 : undefined,
        gorduraPercentual: ind.gorduraCorporal ? ind.gorduraCorporal / 100 : undefined,
        massaMagraKg: ind.massaMagra ? ind.massaMagra / 1000 : undefined,
      }))
      .filter((ind) => ind.peso || ind.gorduraPercentual || ind.massaMagraKg);

    return gerarDashboardMetabolico(examesNormalizados, bioDados);
  }, [exames, indicadores]);

  const timelineFiltrada = useMemo(() => {
    return timelineEventos
      .filter((evento) => tiposTimeline.includes(evento.tipo))
      .filter((evento) =>
        periodoTimeline ? new Date(evento.data).getTime() >= Date.now() - periodoTimeline * DIA_EM_MS : true
      );
  }, [periodoTimeline, timelineEventos, tiposTimeline]);

  const toggleTipoTimeline = (tipo: "consulta" | "exame" | "bioimpedancia") => {
    setTiposTimeline((prev) =>
      prev.includes(tipo) ? prev.filter((item) => item !== tipo) : [...prev, tipo]
    );
  };

  const adicionarMeta = () => {
    if (!novaMeta.trim()) return;
    setMetasPlano((prev) => [...prev, novaMeta.trim()]);
    setNovaMeta("");
  };

  const registrarPlano = (status: "rascunho" | "finalizado", canal?: string) => {
    setHistoricoPlanos((prev) => [
      {
        id: Date.now(),
        status,
        versao: versaoPlano,
        emitidoEm: new Date().toISOString(),
        canal,
        template: templateAtivo.condicao,
        resumo: planoTexto.slice(0, 180),
      },
      ...prev,
    ]);
    toast.success(status === "finalizado" ? "Plano finalizado e registrado" : "Rascunho salvo");
  };

  const comparacaoExames = useMemo(() => {
    return seriesEvolucao
      .map((serie) => {
        const ultimo = serie.pontos[serie.pontos.length - 1];
        const penultimo = serie.pontos[serie.pontos.length - 2];
        if (!ultimo || !penultimo) return null;
        const delta = ultimo.valor - penultimo.valor;
        return {
          parametro: serie.parametro,
          atual: `${ultimo.valor.toFixed(2)} ${serie.unidadeBase || ""}`,
          anterior: `${penultimo.valor.toFixed(2)} ${serie.unidadeBase || ""}`,
          dataAtual: new Date(ultimo.data).toLocaleDateString("pt-BR"),
          dataAnterior: new Date(penultimo.data).toLocaleDateString("pt-BR"),
          tendencia: delta > 0 ? "alta" : delta < 0 ? "queda" : "estavel",
          aviso: serie.avisoUnidade,
        };
      })
      .filter(Boolean);
  }, [seriesEvolucao]);

  const aderencia = useMemo(() => {
    if (!consultas || consultas.length === 0) return { percentual: 0, descricao: "Sem consultas registradas" };
    const concluidas = consultas.filter((c) => c.status === "concluida").length;
    const percentual = Math.round((concluidas / consultas.length) * 100);
    return {
      percentual,
      descricao: `${concluidas} de ${consultas.length} consultas finalizadas`,
    };
  }, [consultas]);

  const pesoData = useMemo(
    () =>
      (indicadores || []).map((ind) => ({
        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
        value: ind.peso ? ind.peso / 1000 : null,
      })),
    [indicadores]
  );

  const imcData = useMemo(
    () =>
      (indicadores || []).map((ind) => ({
        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
        value: ind.imc ? ind.imc / 100 : null,
      })),
    [indicadores]
  );

  const glicemiaData = useMemo(
    () =>
      (indicadores || []).map((ind) => ({
        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
        value: ind.glicemiaJejum ?? null,
      })),
    [indicadores]
  );

  const hba1cData = useMemo(
    () =>
      (indicadores || []).map((ind) => ({
        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
        value: ind.hemoglobinaGlicada ? ind.hemoglobinaGlicada / 100 : null,
      })),
    [indicadores]
  );

  const paData = useMemo(
    () =>
      (indicadores || []).map((ind) => ({
        date: ind.dataAvaliacao ? new Date(ind.dataAvaliacao).toISOString() : "",
        value: ind.pressaoArterialSistolica && ind.pressaoArterialDiastolica
          ? ind.pressaoArterialSistolica / 10 + ind.pressaoArterialDiastolica / 100
          : null,
      })),
    [indicadores]
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

  const formatarDuracao = (duracaoSegundos?: number) => {
    if (!duracaoSegundos || Number.isNaN(duracaoSegundos)) return "--:--";
    const minutos = Math.floor(duracaoSegundos / 60);
    const segundos = Math.floor(duracaoSegundos % 60)
      .toString()
      .padStart(2, "0");
    return `${minutos}:${segundos}`;
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="audios">Áudios</TabsTrigger>
            <TabsTrigger value="bioimpedancia">Bioimpedância</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
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
                                    {duracoesAudio[consulta.id] &&
                                      ` • Duração: ${formatarDuracao(duracoesAudio[consulta.id])}`}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline">Áudio</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <audio
                                controls
                                className="w-full"
                                src={consulta.audioUrl || undefined}
                                onLoadedMetadata={(event) => {
                                  if (!Number.isFinite(event.currentTarget.duration)) return;
                                  setDuracoesAudio((prev) => ({
                                    ...prev,
                                    [consulta.id]: event.currentTarget.duration,
                                  }));
                                }}
                              />
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
                                    unit={serie.unidadeBase || serie.unidade || ""}
                                    title={`Evolução de ${serie.parametro}`}
                                    warning={serie.avisoUnidade}
                                  />
                                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>
                                      Último valor: <strong>{ultimo.valor}</strong>
                                      {serie.unidadeBase ? ` ${serie.unidadeBase}` : ""} em{" "}
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

          {/* Aba Planos Terapêuticos */}
          <TabsContent value="planos">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <CardTitle>Planos terapêuticos</CardTitle>
                      <CardDescription>
                        Gere versões para médico e paciente, personalize metas e registre envios.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Paperclip className="h-4 w-4" /> Template {templateAtivo.condicao}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Condição clínica</Label>
                      <Select
                        value={templateSelecionado}
                        onValueChange={(value) => setTemplateSelecionado(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {planoTemplates.map((tpl) => (
                            <SelectItem key={tpl.condicao} value={tpl.condicao}>
                              {tpl.condicao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Versão</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={versaoPlano === "medico" ? "secondary" : "outline"}
                          onClick={() => setVersaoPlano("medico")}
                        >
                          <Stethoscope className="h-4 w-4 mr-2" /> Médico
                        </Button>
                        <Button
                          variant={versaoPlano === "paciente" ? "secondary" : "outline"}
                          onClick={() => setVersaoPlano("paciente")}
                        >
                          <User className="h-4 w-4 mr-2" /> Paciente
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Metas do plano</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar meta SMART"
                          value={novaMeta}
                          onChange={(e) => setNovaMeta(e.target.value)}
                        />
                        <Button variant="outline" onClick={adicionarMeta}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {metasPlano.map((meta) => (
                          <Badge key={meta} variant="secondary">
                            {meta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Conteúdo do plano ({versaoPlano})</Label>
                      <Textarea
                        className="min-h-[240px]"
                        value={planoTexto}
                        onChange={(e) => setPlanoTexto(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Histórico e checklist são incluídos automaticamente na versão do paciente.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button className="w-full" onClick={() => registrarPlano("rascunho")}>
                        <FileText className="h-4 w-4 mr-2" /> Salvar como rascunho
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => registrarPlano("finalizado", "WhatsApp")}
                      >
                        <Send className="h-4 w-4 mr-2" /> Enviar por WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => registrarPlano("finalizado", "Email")}
                      >
                        <Mail className="h-4 w-4 mr-2" /> Registrar envio por email
                      </Button>
                      <div className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground">Checklist</p>
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Registrar leitura e abertura do plano</li>
                          <li>Capturar assinatura digital ou manual</li>
                          <li>Anexar versão médico e paciente no prontuário</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de versões</CardTitle>
                  <CardDescription>Auditoria simplificada com status e canais de entrega</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {historicoPlanos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum plano registrado ainda.</p>
                  )}
                  {historicoPlanos.map((plano) => (
                    <div
                      key={plano.id}
                      className="flex flex-col gap-1 rounded-lg border bg-white p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{plano.template}</p>
                        <p className="text-xs text-muted-foreground">
                          Versão {plano.versao} • {new Date(plano.emitidoEm).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">{plano.resumo}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={plano.status === "finalizado" ? "default" : "outline"}>{plano.status}</Badge>
                        {plano.canal && <Badge variant="secondary">{plano.canal}</Badge>}
                        <Badge variant="outline">{plano.template}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Evolução e Acompanhamento */}
          <TabsContent value="evolucao">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Timeline de evolução</CardTitle>
                      <CardDescription>Consultas, exames, bioimpedância e marcos clínicos</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <div className="flex gap-2">
                        {["consulta", "exame", "bioimpedancia"].map((tipo) => (
                          <Button
                            key={tipo}
                            size="sm"
                            variant={tiposTimeline.includes(tipo as any) ? "secondary" : "outline"}
                            onClick={() => toggleTipoTimeline(tipo as any)}
                          >
                            {tipo}
                          </Button>
                        ))}
                      </div>
                      <Select
                        value={periodoTimeline ? String(periodoTimeline) : ""}
                        onValueChange={(value) => setPeriodoTimeline(value ? Number(value) : null)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                          <SelectItem value="365">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline">Aderência {aderencia.percentual}%</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {timelineFiltrada.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Sem eventos para exibir</div>
                  ) : (
                    <div className="space-y-4">
                      {timelineFiltrada.map((evento, index) => (
                        <div key={`${evento.tipo}-${index}`} className="flex gap-3 items-start">
                          <div className="w-20 text-xs text-gray-500 pt-1">
                            {new Date(evento.data).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="flex-1 border-l pl-4 pb-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{evento.titulo}</Badge>
                              {evento.badge && <Badge variant="outline">{evento.badge}</Badge>}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{evento.descricao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gráficos de evolução</CardTitle>
                  <CardDescription>Peso, IMC, glicemia, HbA1c e pressão arterial</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <EvolutionChart data={pesoData} label="Peso" color="#2563eb" unit="kg" title="Peso" />
                    <EvolutionChart data={imcData} label="IMC" color="#7c3aed" unit="kg/m²" title="IMC" />
                    <EvolutionChart data={glicemiaData} label="Glicemia" color="#f59e0b" unit="mg/dL" title="Glicemia de Jejum" />
                    <EvolutionChart data={hba1cData} label="HbA1c" color="#ef4444" unit="%" title="Hemoglobina Glicada" />
                    <EvolutionChart data={paData} label="PA" color="#10b981" unit="mmHg" title="Pressão Arterial" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparação de exames recentes</CardTitle>
                  <CardDescription>Diferenças entre os dois últimos pontos de cada parâmetro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(!comparacaoExames || comparacaoExames.length === 0) && (
                    <div className="text-sm text-gray-500">Sem séries suficientes para comparar.</div>
                  )}
                  {comparacaoExames?.map((comp, idx) => (
                    <div key={`${comp?.parametro}-${idx}`} className="p-4 rounded-lg border bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800">{comp?.parametro}</div>
                        {comp?.tendencia === "alta" && <Badge variant="secondary">Em alta</Badge>}
                        {comp?.tendencia === "queda" && <Badge variant="outline">Em queda</Badge>}
                        {comp?.tendencia === "estavel" && <Badge variant="outline">Estável</Badge>}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        Último: {comp?.atual} ({comp?.dataAtual}) • Anterior: {comp?.anterior} ({comp?.dataAnterior})
                      </p>
                      {comp?.aviso && (
                        <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                          {comp.aviso}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dashboard metabólico</CardTitle>
                  <CardDescription>Velocímetros, alertas críticos e tendências normalizadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dashboardMetabolico.velocimetros.map((velocimetro) => (
                      <div key={velocimetro.nome} className="rounded-lg border p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{velocimetro.nome}</p>
                          <Badge
                            variant={
                              velocimetro.faixa === "alto"
                                ? "destructive"
                                : velocimetro.faixa === "moderado"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {velocimetro.faixa}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold mt-1">{velocimetro.valor}</p>
                        {velocimetro.objetivo && (
                          <p className="text-xs text-muted-foreground">Meta: {velocimetro.objetivo}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {dashboardMetabolico.alertas.length > 0 && (
                    <div className="rounded-lg border bg-amber-50 text-amber-900 p-3 space-y-1">
                      <p className="font-semibold">Alertas</p>
                      <ul className="list-disc ml-5 text-sm">
                        {dashboardMetabolico.alertas.map((alerta) => (
                          <li key={alerta}>{alerta}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Object.keys(dashboardMetabolico.tendencias).length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(dashboardMetabolico.tendencias).map(([metrica, tendencia]) => (
                        <Badge key={metrica} variant="outline" className="mr-2">
                          {metrica}: {tendencia}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores de aderência</CardTitle>
                  <CardDescription>Visão rápida de acompanhamento longitudinal</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <p className="text-sm text-gray-600">Consultas finalizadas</p>
                    <p className="text-3xl font-bold">{aderencia.percentual}%</p>
                    <p className="text-xs text-gray-500">{aderencia.descricao}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <p className="text-sm text-gray-600">Exames registrados</p>
                    <p className="text-3xl font-bold">{exames?.length || 0}</p>
                    <p className="text-xs text-gray-500">Pacotes utilizados em séries evolutivas</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <p className="text-sm text-gray-600">Bioimpedâncias</p>
                    <p className="text-3xl font-bold">{bioimpedancias?.length || 0}</p>
                    <p className="text-xs text-gray-500">Consideradas nos marcos do paciente</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
