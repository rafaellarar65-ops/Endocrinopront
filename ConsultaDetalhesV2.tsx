import { useAuth } from "@/_core/hooks/useAuth";
import { AbaExameFisico } from "@/components/consulta/AbaExameFisico";
import { AbaResumoEvolutivo } from "@/components/consulta/AbaResumoEvolutivo";
import { CronometroConsulta } from "@/components/consulta/CronometroConsulta";
import { UltimasConsultasColumn } from "@/components/consulta/UltimasConsultasColumn";
import { IndicadoresSidebar } from "@/components/consulta/IndicadoresSidebar";
import { AbaHipotesesConduta } from "@/components/consulta/AbaHipotesesConduta";
import { AbaPerfilMetabolico } from "@/components/consulta/AbaPerfilMetabolico";
import { ModalNovaPrescricao } from "@/components/prescricoes/ModalNovaPrescricao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, 
  Calendar,
  Clock,
  Mic,
  Square,
  Loader2,
  Save,
  FileText,
  Stethoscope,
  Activity,
  Brain,
  User,
  Sparkles,
  X,
  Plus,
  CheckCircle,
  Download,
  Menu
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { getLoginUrl } from "@/const";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExameResultadosTable } from "./ExameResultadosTable";
import { gerarParametroId } from "./examesUtils";

export default function ConsultaDetalhesV2() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/consulta/:id");
  const consultaId = params?.id ? parseInt(params.id) : 0;

  const [abaAtiva, setAbaAtiva] = useState<string>("hma");
  const [modalPrescricaoOpen, setModalPrescricaoOpen] = useState(false);
  const [diagnosticoInicial, setDiagnosticoInicial] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [arquivoExame, setArquivoExame] = useState<File | null>(null);
  const [isProcessandoExame, setIsProcessandoExame] = useState(false);
  const [exameEmEdicaoId, setExameEmEdicaoId] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estado para receituário
  const [receituario, setReceituario] = useState({
    medicamentos: [
      { nome: "", posologia: "", quantidade: "", observacoes: "" }
    ],
    orientacoes: "",
  });

  // Estado para anamnese
  const [anamnese, setAnamnese] = useState({
    queixaPrincipal: "",
    hda: "",
    historicoPatologico: "",
    medicamentosEmUso: "",
    alergias: "",
    historicoFamiliar: "",
    habitosVida: "",
  });

  // Estado para exame físico
  const [exameFisico, setExameFisico] = useState({
    peso: "",
    altura: "",
    imc: "",
    pressaoArterial: "",
    frequenciaCardiaca: "",
    temperatura: "",
    exameGeral: "",
    exameEspecifico: "",
  });

  const [novoExame, setNovoExame] = useState({
    tipo: "",
    dataExame: "",
    laboratorio: "",
    pdfUrl: "",
    imagemUrl: "",
    observacoes: "",
  });
  const [resultadosDigitados, setResultadosDigitados] = useState([
    { id: undefined as number | undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" as const },
  ]);

  const { data: consulta, isLoading, refetch } = trpc.consultas.getById.useQuery(
    { id: consultaId },
    { enabled: isAuthenticated && consultaId > 0 }
  );

  const { data: paciente } = trpc.pacientes.getById.useQuery(
    { id: consulta?.pacienteId || 0 },
    { enabled: isAuthenticated && !!consulta?.pacienteId }
  );

  const { data: consultasRecentes } = trpc.consultas.getByPaciente.useQuery(
    { pacienteId: consulta?.pacienteId || 0 },
    { enabled: isAuthenticated && !!consulta?.pacienteId }
  );

  const { data: examesPaciente, isLoading: carregandoExames, refetch: refetchExamesPaciente } =
    trpc.exames.getByPaciente.useQuery(
      { pacienteId: consulta?.pacienteId || 0 },
      { enabled: isAuthenticated && !!consulta?.pacienteId }
    );

  const updateConsultaMutation = trpc.consultas.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar consulta: " + error.message);
    },
  });

  const syncHmaMutation = trpc.consultas.syncHmaWithAI.useMutation({
    onSuccess: () => {
      toast.success("Sugestões de exame físico geradas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao gerar sugestões: " + error.message);
    },
  });

  const generateSummaryMutation = trpc.consultas.generateSummary.useMutation({
    onSuccess: () => {
      toast.success("Resumo gerado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao gerar resumo: " + error.message);
    },
  });

  const processarAnamneseMutation = trpc.ia.processarAnamnese.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        const anamneseEstruturada = {
          queixaPrincipal: result.data.queixaPrincipal || "",
          hda: result.data.hda || "",
          historicoPatologico: result.data.historicoPatologico || "",
          medicamentosEmUso: result.data.medicamentosEmUso || "",
          alergias: result.data.alergias || "",
          historicoFamiliar: result.data.historicoFamiliar || "",
          habitosVida: result.data.habitosVida || "",
        };
        setAnamnese(anamneseEstruturada);
        setHasUnsavedChanges(true);
        toast.success("Anamnese estruturada com sucesso! Revise os campos e clique em Salvar.", {
          duration: 5000,
        });
      } else {
        toast.error("Erro ao processar áudio: " + (result.error || "Erro desconhecido"));
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error("Erro ao processar áudio: " + error.message);
      setIsProcessing(false);
    },
  });

  const createExameMutation = trpc.exames.create.useMutation({
    onSuccess: () => {
      toast.success("Exame salvo com sucesso!");
      setNovoExame({ tipo: "", dataExame: "", laboratorio: "", pdfUrl: "", imagemUrl: "", observacoes: "" });
      setResultadosDigitados([{ id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }]);
      refetchExamesPaciente();
      setExameEmEdicaoId(null);
    },
    onError: (error) => {
      toast.error("Erro ao salvar exame: " + error.message);
    },
  });

  const updateExameMutation = trpc.exames.update.useMutation({
    onSuccess: () => {
      toast.success("Exame atualizado com sucesso!");
      setNovoExame({ tipo: "", dataExame: "", laboratorio: "", pdfUrl: "", imagemUrl: "", observacoes: "" });
      setResultadosDigitados([{ id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }]);
      setExameEmEdicaoId(null);
      refetchExamesPaciente();
    },
    onError: (error) => toast.error("Erro ao atualizar exame: " + error.message),
  });

  const deleteExameMutation = trpc.exames.delete.useMutation({
    onSuccess: () => {
      toast.success("Exame removido");
      refetchExamesPaciente();
    },
    onError: (error) => toast.error("Erro ao remover exame: " + error.message),
  });

  const processarExameLabMutation = trpc.ia.processarExameLab.useMutation({
    onMutate: () => setIsProcessandoExame(true),
    onSuccess: (result) => {
      toast.success("Exame enviado para IA e salvo");
      if (result?.dadosExtraidos) {
        setNovoExame((prev) => ({
          ...prev,
          tipo: result.dadosExtraidos.tipoExame || prev.tipo,
          laboratorio: result.dadosExtraidos.laboratorio || prev.laboratorio,
          dataExame: result.dadosExtraidos.dataColeta || prev.dataExame,
          imagemUrl: result.exame?.imagemUrl || prev.imagemUrl,
        }));
        const normalizados = (result.dadosExtraidos.valores || []).map((v: any, idx: number) => ({
          id: v.id ?? gerarParametroId(v.parametro || "", 3000 + idx),
          parametro: v.parametro,
          valor: v.valor,
          unidade: v.unidade,
          referencia: v.valorReferencia,
          status: v.status ?? "normal",
        }));
        setResultadosDigitados(normalizados.length ? normalizados : [{ id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }]);
        refetchExamesPaciente();
      }
      setArquivoExame(null);
      setIsProcessandoExame(false);
    },
    onError: (error) => {
      toast.error("Erro ao processar exame: " + error.message);
      setIsProcessandoExame(false);
    },
  });

  const salvandoExame = createExameMutation.isPending || updateExameMutation.isPending || processarExameLabMutation.isPending;

  const gerarResumoEvolutivoMutation = trpc.consultas.gerarResumoEvolutivo.useMutation({
    onError: (error) => {
      toast.error("Erro ao gerar resumo evolutivo: " + error.message);
    },
  });

  // Carregar dados da consulta quando disponível
  useEffect(() => {
    if (consulta) {
      if (consulta.anamnese) {
        try {
          const anamneseData = typeof consulta.anamnese === 'string'
            ? JSON.parse(consulta.anamnese) 
            : consulta.anamnese;
          setAnamnese(prev => ({ ...prev, ...anamneseData }));
        } catch (e) {
          console.error("Erro ao parsear anamnese:", e);
        }
      }
      if (consulta.exameFisico) {
        try {
          const exameFisicoData = typeof consulta.exameFisico === 'string'
            ? JSON.parse(consulta.exameFisico)
            : consulta.exameFisico;
          setExameFisico(prev => ({ ...prev, ...exameFisicoData }));
        } catch (e) {
          console.error("Erro ao parsear exame físico:", e);
        }
      }

      if (!novoExame.dataExame && consulta.dataHora) {
        const dataConsulta = new Date(consulta.dataHora);
        const iso = dataConsulta.toISOString().split("T")[0];
        setNovoExame((prev) => ({ ...prev, dataExame: iso }));
      }
    }
  }, [consulta, novoExame.dataExame]);

  // Calcular IMC automaticamente
  useEffect(() => {
    const peso = parseFloat(exameFisico.peso);
    const altura = parseFloat(exameFisico.altura);
    if (peso > 0 && altura > 0) {
      const imc = peso / (altura * altura);
      setExameFisico(prev => ({ ...prev, imc: imc.toFixed(1) }));
    }
  }, [exameFisico.peso, exameFisico.altura]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Gravação iniciada");
    } catch (error) {
      toast.error("Erro ao acessar microfone: " + (error as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Gravação finalizada");
    }
  };

  const processAudio = async () => {
    if (!audioBlob) {
      toast.error("Nenhum áudio gravado");
      return;
    }

    if (!consulta?.pacienteId) {
      toast.error("Paciente não encontrado");
      return;
    }

    setIsProcessing(true);
    toast.info("Processando áudio com IA... Isso pode levar alguns segundos");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) {
          toast.error("Erro ao converter áudio");
          setIsProcessing(false);
          return;
        }

        let idade: number | undefined;
        if (paciente?.dataNascimento) {
          const hoje = new Date();
          const nascimento = new Date(paciente.dataNascimento);
          idade = hoje.getFullYear() - nascimento.getFullYear();
        }

        processarAnamneseMutation.mutate({
          audioBlob: base64Audio,
          pacienteId: consulta.pacienteId,
          patientContext: {
            nome: paciente?.nome || "",
            idade,
            sexo: paciente?.sexo || undefined,
          },
        });
      };
    } catch (error) {
      toast.error("Erro ao processar áudio: " + (error as Error).message);
      setIsProcessing(false);
    }
  };

  const handleSaveAnamnese = () => {
    updateConsultaMutation.mutate(
      {
        id: consultaId,
        anamnese: JSON.stringify(anamnese),
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        },
      }
    );
  };

  const handleSyncHma = async () => {
    setIsSyncing(true);
    try {
      await syncHmaMutation.mutateAsync({ consultaId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProcessarExameComIA = async () => {
    if (!consulta?.pacienteId) {
      toast.error("Paciente não encontrado para vincular o exame.");
      return;
    }

    if (!arquivoExame) {
      toast.error("Selecione um PDF ou imagem do exame.");
      return;
    }

    const base64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString().split(',')[1];
        resolve(result || null);
      };
      reader.readAsDataURL(arquivoExame);
    });

    if (!base64) {
      toast.error("Não foi possível ler o arquivo selecionado.");
      return;
    }

    processarExameLabMutation.mutate({
      imageBlob: base64,
      pacienteId: consulta.pacienteId,
      consultaId,
      mimeType: arquivoExame.type || undefined,
      fileName: arquivoExame.name,
    });
  };

  const handleEditarExame = (exame: any) => {
    setExameEmEdicaoId(exame.id);
    setNovoExame({
      tipo: exame.tipo || "",
      dataExame: exame.dataExame ? new Date(exame.dataExame).toISOString().slice(0, 10) : "",
      laboratorio: exame.laboratorio || "",
      pdfUrl: exame.pdfUrl || "",
      imagemUrl: exame.imagemUrl || "",
      observacoes: exame.observacoes || "",
    });
    const resultadosNormalizados = Array.isArray(exame.resultados) && exame.resultados.length
      ? exame.resultados.map((r: any, idx: number) => ({
          id: r.id ?? gerarParametroId(r.parametro || "", 2000 + idx),
          parametro: r.parametro || "",
          valor: r.valor || "",
          unidade: r.unidade || "",
          referencia: r.referencia || "",
          status: r.status || "normal",
        }))
      : [{ id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }];
    setResultadosDigitados(resultadosNormalizados);
  };

  const handleRemoverExame = (id: number) => {
    if (!window.confirm("Deseja remover este exame?")) return;
    deleteExameMutation.mutate({ id });
  };

  const handleSalvarExame = (event: React.FormEvent) => {
    event.preventDefault();
    if (!consulta?.pacienteId) {
      toast.error("Paciente não encontrado para vincular o exame.");
      return;
    }

    if (!novoExame.dataExame) {
      toast.error("Informe a data do exame.");
      return;
    }

    const resultadosFiltrados = resultadosDigitados
      .filter((r) => r.parametro && r.valor)
      .map((r, idx) => ({
        id: r.id ?? gerarParametroId(r.parametro, 2000 + idx),
        parametro: r.parametro,
        valor: r.valor,
        unidade: r.unidade,
        referencia: r.referencia,
        status: r.status,
      }));

    const payloadBase = {
      pacienteId: consulta.pacienteId,
      consultaId,
      dataExame: new Date(novoExame.dataExame),
      tipo: novoExame.tipo || undefined,
      laboratorio: novoExame.laboratorio || undefined,
      observacoes: novoExame.observacoes || undefined,
      resultados: resultadosFiltrados.length ? resultadosFiltrados : undefined,
      pdfUrl: novoExame.pdfUrl || undefined,
      imagemUrl: novoExame.imagemUrl || undefined,
    };

    if (exameEmEdicaoId) {
      updateExameMutation.mutate({ ...payloadBase, id: exameEmEdicaoId });
    } else {
      createExameMutation.mutate(payloadBase);
    }
  };

  const handleAddResultado = () => {
    setResultadosDigitados((prev) => [...prev, { id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }]);
  };

  const handleUpdateResultado = (index: number, field: string, value: string) => {
    setResultadosDigitados((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const parametroAtual = field === "parametro" ? value : item.parametro;
      const id = item.id ?? gerarParametroId(parametroAtual, 1000 + index);
      return { ...item, [field]: value, id };
    }));
  };

  const handleRemoveResultado = (index: number) => {
    setResultadosDigitados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalizarConsulta = async () => {
    if (!consulta) return;
    setIsFinalizando(true);

    try {
      await gerarResumoEvolutivoMutation.mutateAsync({ consultaId });

      await updateConsultaMutation.mutateAsync({
        id: consultaId,
        status: "concluida" as const,
      });

      toast.success("Consulta finalizada com sucesso!");
      setLocation(`/pacientes/${consulta.pacienteId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao finalizar consulta: " + message);
    } finally {
      setIsFinalizando(false);
    }
  };

  const gerarReceituarioMutation = trpc.consultas.gerarReceituario.useMutation({
    onSuccess: (result) => {
      if (result.success && result.pdfUrl) {
        setPdfUrl(result.pdfUrl);
        toast.success("Receituário gerado com sucesso!");
      }
      setIsGeneratingPDF(false);
    },
    onError: (error) => {
      toast.error("Erro ao gerar receituário: " + error.message);
      setIsGeneratingPDF(false);
    },
  });

  const handleGerarReceituario = async () => {
    if (!paciente || !consulta) {
      toast.error("Dados do paciente ou consulta não encontrados");
      return;
    }

    if (receituario.medicamentos.every(m => !m.nome)) {
      toast.error("Adicione pelo menos um medicamento");
      return;
    }

    setIsGeneratingPDF(true);
    gerarReceituarioMutation.mutate({
      consultaId,
      pacienteNome: paciente.nome,
      data: new Date(consulta.dataHora).toLocaleDateString("pt-BR"),
      medicamentos: receituario.medicamentos.filter(m => m.nome).map(m => ({
        nome: m.nome,
        dosagem: "",
        via: "",
        posologia: m.posologia,
        duracao: m.quantidade,
      })),
      instrucoesAdicionais: receituario.orientacoes,
    });
  };

  // Loading e auth
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!consulta || !paciente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Consulta não encontrada</p>
        <Button onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const abas = [
    { id: "hma", label: "HMA", icon: FileText },
    { id: "exame-fisico", label: "EXAME FÍSICO", icon: Stethoscope },
    { id: "hipoteses", label: "HIPÓTESES", icon: Brain },
    { id: "resumo", label: "RESUMO", icon: Activity },
    { id: "perfil-met", label: "PERFIL MET", icon: Activity },
    { id: "exames", label: "EXAMES", icon: FileText },
    { id: "docs", label: "DOCS", icon: FileText },
    { id: "bia", label: "BIA", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* COLUNA 1: Sidebar com Indicadores de IA (20%) - Módulo 9 */}
      <IndicadoresSidebar
        consultaId={consultaId}
        pacienteNome={paciente?.nome}
      />

      {/* COLUNA 2: Área Central (60%) */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")}>
              <Menu className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              CADASTRO
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#2C5AA0]">{paciente.nome}</h1>
              <p className="text-sm text-gray-600">
                {paciente.dataNascimento ? (() => {
                  const hoje = new Date();
                  const nascimento = new Date(paciente.dataNascimento);
                  let idade = hoje.getFullYear() - nascimento.getFullYear();
                  const mesAtual = hoje.getMonth();
                  const mesNascimento = nascimento.getMonth();
                  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
                    idade--;
                  }
                  return `${idade} anos`;
                })() : "Idade não informada"} • Consulta: {new Date(consulta.dataHora).toLocaleDateString("pt-BR")} às {new Date(consulta.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CronometroConsulta inicioConsulta={consulta.status === "em_andamento" ? consulta.dataHora.toString() : null} />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleFinalizarConsulta}
              disabled={isFinalizando || gerarResumoEvolutivoMutation.isPending}
            >
              {isFinalizando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                "FINALIZAR"
              )}
            </Button>
          </div>
        </header>

        {/* Menu de Abas */}
        <nav className="bg-white border-b px-6 py-2 flex gap-2 overflow-x-auto">
          {abas.map((aba) => {
            const Icon = aba.icon;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? "bg-[#2C5AA0] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {aba.label}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo da Aba Ativa */}
        <div className="flex-1 overflow-y-auto p-6">
          {abaAtiva === "hma" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>HMA - História da Moléstia Atual</CardTitle>
                    <CardDescription>Histórico clínico e queixa principal</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isRecording ? (
                      <Button 
                        variant="outline" 
                        onClick={startRecording}
                        disabled={isProcessing}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Gravar Áudio
                      </Button>
                    ) : (
                      <Button 
                        variant="destructive" 
                        onClick={stopRecording}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Parar Gravação
                      </Button>
                    )}
                    {audioBlob && !isRecording && (
                      <Button 
                        onClick={processAudio}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Estruturar com IA
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleSyncHma}
                      disabled={isSyncing || !anamnese.queixaPrincipal}
                    >
                      {isSyncing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Sincronizar com IA
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleSaveAnamnese} 
                      disabled={updateConsultaMutation.isPending}
                      variant={hasUnsavedChanges ? "default" : "outline"}
                      className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {hasUnsavedChanges ? "Salvar Alterações" : "Salvar"}
                    </Button>
                    {hasUnsavedChanges && (
                      <span className="text-sm text-orange-600 font-medium">
                        Alterações não salvas
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRecording && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-medium">Gravando áudio...</span>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="queixaPrincipal">Queixa Principal</Label>
                    <Textarea
                      id="queixaPrincipal"
                      value={anamnese.queixaPrincipal}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, queixaPrincipal: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Descreva a queixa principal do paciente..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hda">História da Doença Atual (HDA)</Label>
                    <Textarea
                      id="hda"
                      value={anamnese.hda}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, hda: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Descreva a evolução da doença atual..."
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="historicoPatologico">Histórico Patológico</Label>
                    <Textarea
                      id="historicoPatologico"
                      value={anamnese.historicoPatologico}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, historicoPatologico: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Doenças prévias, cirurgias, internações..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="medicamentosEmUso">Medicamentos em Uso</Label>
                    <Textarea
                      id="medicamentosEmUso"
                      value={anamnese.medicamentosEmUso}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, medicamentosEmUso: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Liste os medicamentos em uso regular..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alergias">Alergias</Label>
                    <Input
                      id="alergias"
                      value={anamnese.alergias}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, alergias: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Alergias medicamentosas ou alimentares..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="historicoFamiliar">Histórico Familiar</Label>
                    <Textarea
                      id="historicoFamiliar"
                      value={anamnese.historicoFamiliar}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, historicoFamiliar: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Doenças na família (pais, irmãos)..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="habitosVida">Hábitos de Vida</Label>
                    <Textarea
                      id="habitosVida"
                      value={anamnese.habitosVida}
                      onChange={(e) => {
                        setAnamnese({ ...anamnese, habitosVida: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Atividade física, alimentação, tabagismo, etilismo..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {abaAtiva === "exame-fisico" && (
            <AbaExameFisico consultaId={consultaId} />
          )}

          {abaAtiva === "hipoteses" && (
            <AbaHipotesesConduta consultaId={consultaId} />
          )}

          {abaAtiva === "resumo" && (
            <AbaResumoEvolutivo consultaId={consultaId} />
          )}

          {abaAtiva === "perfil-met" && consulta && paciente && (
            <AbaPerfilMetabolico consultaId={consultaId} pacienteId={consulta.pacienteId} />
          )}

          {abaAtiva === "exames" && (
            <Card>
              <CardHeader>
                <CardTitle>Exames Laboratoriais</CardTitle>
                <CardDescription>Cadastro rápido e visualização dos exames do paciente</CardDescription>
                {exameEmEdicaoId && (
                  <div className="text-sm text-amber-600 font-medium">Editando exame #{exameEmEdicaoId} — salve ou cancele para sair do modo de edição</div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSalvarExame} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataExame">Data do exame</Label>
                      <Input
                        id="dataExame"
                        type="date"
                        value={novoExame.dataExame}
                        onChange={(e) => setNovoExame({ ...novoExame, dataExame: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Input
                        id="tipo"
                        placeholder="Ex: Perfil lipídico, HbA1c, TSH"
                        value={novoExame.tipo}
                        onChange={(e) => setNovoExame({ ...novoExame, tipo: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="laboratorio">Laboratório</Label>
                      <Input
                        id="laboratorio"
                        placeholder="Nome do laboratório"
                        value={novoExame.laboratorio}
                        onChange={(e) => setNovoExame({ ...novoExame, laboratorio: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pdfUrl">PDF ou link</Label>
                      <Input
                        id="pdfUrl"
                        placeholder="URL para o PDF ou imagem do exame"
                        value={novoExame.pdfUrl}
                        onChange={(e) => setNovoExame({ ...novoExame, pdfUrl: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="arquivoExame">Upload para IA (imagem/PDF)</Label>
                      <Input
                        id="arquivoExame"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setArquivoExame(e.target.files?.[0] || null)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!arquivoExame || isProcessandoExame}
                          onClick={handleProcessarExameComIA}
                        >
                          {isProcessandoExame ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Enviar p/ IA
                        </Button>
                        {arquivoExame && <span className="text-xs text-gray-500 truncate">{arquivoExame.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Resultados digitados</Label>
                        <p className="text-xs text-gray-500">Preencha valores manualmente quando o PDF não estiver disponível</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddResultado}>
                        <Plus className="h-4 w-4 mr-2" /> Linha
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {resultadosDigitados.map((resultado, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border border-dashed border-gray-200 p-3 rounded-lg">
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs">Parâmetro</Label>
                            <Input
                              placeholder="Ex: Glicemia de jejum"
                              value={resultado.parametro}
                              onChange={(e) => handleUpdateResultado(index, "parametro", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Valor</Label>
                            <Input
                              placeholder="Ex: 110"
                              value={resultado.valor}
                              onChange={(e) => handleUpdateResultado(index, "valor", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unidade</Label>
                            <Input
                              placeholder="mg/dL"
                              value={resultado.unidade}
                              onChange={(e) => handleUpdateResultado(index, "unidade", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Referência</Label>
                            <Input
                              placeholder="70 - 99"
                              value={resultado.referencia}
                              onChange={(e) => handleUpdateResultado(index, "referencia", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Status</Label>
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                              value={resultado.status}
                              onChange={(e) => handleUpdateResultado(index, "status", e.target.value)}
                            >
                              <option value="normal">Normal</option>
                              <option value="alterado">Alterado</option>
                              <option value="critico">Crítico</option>
                            </select>
                          </div>
                          {resultadosDigitados.length > 1 && (
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveResultado(index)}>
                                Remover
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      rows={3}
                      placeholder="Valores relevantes, suspeitas ou observações livres"
                      value={novoExame.observacoes}
                      onChange={(e) => setNovoExame({ ...novoExame, observacoes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    {exameEmEdicaoId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setExameEmEdicaoId(null);
                          setNovoExame({ tipo: "", dataExame: "", laboratorio: "", pdfUrl: "", imagemUrl: "", observacoes: "" });
                          setResultadosDigitados([{ id: undefined, parametro: "", valor: "", unidade: "", referencia: "", status: "normal" }]);
                        }}
                      >
                        Cancelar edição
                      </Button>
                    )}
                    <Button type="submit" disabled={salvandoExame}>
                      {salvandoExame ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          {exameEmEdicaoId ? <CheckCircle className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          {exameEmEdicaoId ? "Atualizar exame" : "Adicionar exame"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Histórico recente</h3>
                    {carregandoExames && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Carregando
                      </div>
                    )}
                  </div>

                  {!examesPaciente || examesPaciente.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      Nenhum exame cadastrado para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examesPaciente.map((exame) => (
                        <Card key={exame.id} className="border border-gray-200">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{exame.tipo || "Exame"}</CardTitle>
                                <CardDescription>
                                  {new Date(exame.dataExame).toLocaleDateString("pt-BR")}
                                  {exame.laboratorio ? ` • ${exame.laboratorio}` : ""}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {exame.pdfUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exame.pdfUrl && window.open(exame.pdfUrl, "_blank")}
                                  >
                                    Ver arquivo
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleEditarExame(exame)}>
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleRemoverExame(exame.id)}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {exame.observacoes && (
                            <CardContent className="text-sm text-gray-700 whitespace-pre-line">
                              {exame.observacoes}
                            </CardContent>
                          )}
                          {Array.isArray(exame.resultados) && exame.resultados.length > 0 && (
                            <ExameResultadosTable resultados={exame.resultados} compact />
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {abaAtiva === "docs" && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos Médicos</CardTitle>
                <CardDescription>Gerar receitas, atestados, pedidos de exames e relatórios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grid de Botões de Documentos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Botão Gerar Receita */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      const hipoteses = consulta.hipotesesDiagnosticas || "";
                      setDiagnosticoInicial(hipoteses);
                      setModalPrescricaoOpen(true);
                    }}
                  >
                    <FileText className="h-8 w-8 text-blue-600" />
                    <span className="font-semibold">Gerar Receita</span>
                  </Button>

                  {/* Botão Gerar Atestado (placeholder) */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => alert("Funcionalidade em desenvolvimento")}
                  >
                    <FileText className="h-8 w-8 text-green-600" />
                    <span className="font-semibold">Gerar Atestado</span>
                  </Button>

                  {/* Botão Pedido de Exames (placeholder) */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => alert("Funcionalidade em desenvolvimento")}
                  >
                    <FileText className="h-8 w-8 text-purple-600" />
                    <span className="font-semibold">Pedido de Exames</span>
                  </Button>

                  {/* Botão Relatório Médico (placeholder) */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => alert("Funcionalidade em desenvolvimento")}
                  >
                    <FileText className="h-8 w-8 text-orange-600" />
                    <span className="font-semibold">Relatório Médico</span>
                  </Button>

                  {/* Botão Declaração de Comparecimento (placeholder) */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => alert("Funcionalidade em desenvolvimento")}
                  >
                    <FileText className="h-8 w-8 text-teal-600" />
                    <span className="font-semibold">Declaração</span>
                  </Button>

                  {/* Botão Laudo Médico (placeholder) */}
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => alert("Funcionalidade em desenvolvimento")}
                  >
                    <FileText className="h-8 w-8 text-red-600" />
                    <span className="font-semibold">Laudo Médico</span>
                  </Button>
                </div>

                {/* Placeholder antigo - remover depois */}
                <div className="hidden space-y-4">
                  <h3 className="font-semibold text-lg">Receituário Médico (ANTIGO)</h3>
                  
                  {receituario.medicamentos.map((med, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Medicamento {index + 1}</h4>
                        {receituario.medicamentos.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const novos = receituario.medicamentos.filter((_, i) => i !== index);
                              setReceituario({ ...receituario, medicamentos: novos });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor={`med-nome-${index}`}>Nome do Medicamento</Label>
                          <Input
                            id={`med-nome-${index}`}
                            value={med.nome}
                            onChange={(e) => {
                              const novos = [...receituario.medicamentos];
                              novos[index].nome = e.target.value;
                              setReceituario({ ...receituario, medicamentos: novos });
                            }}
                            placeholder="Ex: Metformina 850mg"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor={`med-posologia-${index}`}>Posologia</Label>
                          <Input
                            id={`med-posologia-${index}`}
                            value={med.posologia}
                            onChange={(e) => {
                              const novos = [...receituario.medicamentos];
                              novos[index].posologia = e.target.value;
                              setReceituario({ ...receituario, medicamentos: novos });
                            }}
                            placeholder="Ex: 1 comprimido 2x ao dia"
                          />
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label htmlFor={`med-quantidade-${index}`}>Quantidade</Label>
                            <Input
                              id={`med-quantidade-${index}`}
                              value={med.quantidade}
                              onChange={(e) => {
                                const novos = [...receituario.medicamentos];
                                novos[index].quantidade = e.target.value;
                                setReceituario({ ...receituario, medicamentos: novos });
                              }}
                              placeholder="Ex: 60 comprimidos"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor={`med-observacoes-${index}`}>Observações</Label>
                            <Input
                              id={`med-observacoes-${index}`}
                              value={med.observacoes}
                              onChange={(e) => {
                                const novos = [...receituario.medicamentos];
                                novos[index].observacoes = e.target.value;
                                setReceituario({ ...receituario, medicamentos: novos });
                              }}
                              placeholder="Ex: Tomar após as refeições"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReceituario({
                        ...receituario,
                        medicamentos: [
                          ...receituario.medicamentos,
                          { nome: "", posologia: "", quantidade: "", observacoes: "" }
                        ]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Medicamento
                  </Button>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="orientacoes">Orientações Gerais</Label>
                    <Textarea
                      id="orientacoes"
                      value={receituario.orientacoes}
                      onChange={(e) => setReceituario({ ...receituario, orientacoes: e.target.value })}
                      placeholder="Orientações adicionais para o paciente..."
                      rows={4}
                    />
                  </div>
                </div>
                
                {pdfUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">Receituário gerado com sucesso!</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(pdfUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {abaAtiva === "bia" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bioimpedância</CardTitle>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Atualizar com IA
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Conteúdo da aba Bioimpedância...</p>
              </CardContent>
            </Card>
          )}

          {abaAtiva === "extra" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Botão Extra</CardTitle>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Atualizar com IA
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Conteúdo da aba Extra...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* COLUNA 3: Últimas Consultas (20%) */}
      <UltimasConsultasColumn
        consultaIdAtual={consulta.id}
        pacienteId={consulta.pacienteId}
      />

      {/* Modal de Nova Prescrição */}
      <ModalNovaPrescricao
        open={modalPrescricaoOpen}
        onClose={() => setModalPrescricaoOpen(false)}
        pacienteId={consulta.pacienteId}
        diagnosticoInicial={diagnosticoInicial}
      />
    </div>
  );
}
