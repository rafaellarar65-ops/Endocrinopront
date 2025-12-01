import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Sparkles, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ItemPrescricao {
  medicamentoTextoLivre: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  orientacoes?: string;
}

interface ModalNovaPrescricaoProps {
  open: boolean;
  onClose: () => void;
  pacienteId: number;
  diagnosticoInicial?: string;
}

export function ModalNovaPrescricao({
  open,
  onClose,
  pacienteId,
  diagnosticoInicial,
}: ModalNovaPrescricaoProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [dataPrescricao, setDataPrescricao] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPrescricao[]>([
    {
      medicamentoTextoLivre: "",
      dosagem: "",
      frequencia: "",
      duracao: "",
      orientacoes: "",
    },
  ]);

  const [diagnostico, setDiagnostico] = useState("");
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const { data: paciente } = trpc.pacientes.getById.useQuery({ id: pacienteId });

  // Pré-popular diagnóstico quando o modal abre
  useEffect(() => {
    if (open && diagnosticoInicial) {
      setDiagnostico(diagnosticoInicial);
    }
  }, [open, diagnosticoInicial]);

  const criarMutation = trpc.prescricoes.criar.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Prescrição criada com sucesso",
      });
      utils.prescricoes.listar.invalidate({ pacienteId });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar prescrição",
        variant: "destructive",
      });
    },
  });

  const sugerirMutation = trpc.prescricoes.sugerirPrescricao.useQuery(
    {
      pacienteId,
      diagnostico,
    },
    {
      enabled: false,
    }
  );

  const verificarInteracoesMutation = trpc.prescricoes.verificarInteracoes.useQuery(
    {
      medicamentos: itens
        .filter((i) => i.medicamentoTextoLivre.trim())
        .map((i) => i.medicamentoTextoLivre),
    },
    {
      enabled: false,
    }
  );

  const handleClose = () => {
    setDataPrescricao(new Date().toISOString().split("T")[0]);
    setObservacoes("");
    setItens([
      {
        medicamentoTextoLivre: "",
        dosagem: "",
        frequencia: "",
        duracao: "",
        orientacoes: "",
      },
    ]);
    setDiagnostico("");
    setInteracoes([]);
    onClose();
  };

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        medicamentoTextoLivre: "",
        dosagem: "",
        frequencia: "",
        duracao: "",
        orientacoes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemPrescricao,
    value: string
  ) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  };

  const handleSugerirIA = async () => {
    if (!diagnostico.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um diagnóstico para obter sugestões",
        variant: "destructive",
      });
      return;
    }

    setLoadingSugestao(true);
    try {
      const result = await sugerirMutation.refetch();
      if (result.data && result.data.length > 0) {
        setItens(
          result.data.map((sugestao: any) => ({
            medicamentoTextoLivre: sugestao.medicamento,
            dosagem: sugestao.dosagem,
            frequencia: sugestao.frequencia,
            duracao: sugestao.duracao,
            orientacoes: sugestao.orientacoes || "",
          }))
        );
        toast({
          title: "Sugestões geradas!",
          description: `${result.data.length} medicamento(s) sugerido(s) pela IA`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar sugestões",
        variant: "destructive",
      });
    } finally {
      setLoadingSugestao(false);
    }
  };

  const handleVerificarInteracoes = async () => {
    const medicamentos = itens
      .filter((i) => i.medicamentoTextoLivre.trim())
      .map((i) => i.medicamentoTextoLivre);

    if (medicamentos.length < 2) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos 2 medicamentos para verificar interações",
      });
      return;
    }

    try {
      const result = await verificarInteracoesMutation.refetch();
      if (result.data) {
        setInteracoes(result.data);
        if (result.data.length === 0) {
          toast({
            title: "Nenhuma interação detectada",
            description: "Os medicamentos não apresentam interações conhecidas",
          });
        } else {
          toast({
            title: "Interações detectadas!",
            description: `${result.data.length} interação(ões) encontrada(s)`,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar interações",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    const itensValidos = itens.filter(
      (item) =>
        item.medicamentoTextoLivre.trim() &&
        item.dosagem.trim() &&
        item.frequencia.trim() &&
        item.duracao.trim()
    );

    if (itensValidos.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um medicamento completo",
        variant: "destructive",
      });
      return;
    }

    criarMutation.mutate({
      pacienteId,
      dataPrescricao,
      itens: itensValidos,
      observacoes: observacoes.trim() || undefined,
    });
  };

  const handleGerarPdf = async () => {
    const itensValidos = itens.filter(
      (item) =>
        item.medicamentoTextoLivre.trim() &&
        item.dosagem.trim() &&
        item.frequencia.trim() &&
        item.duracao.trim()
    );

    if (itensValidos.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um medicamento completo para gerar o PDF",
        variant: "destructive",
      });
      return;
    }

    if (!paciente?.nome) {
      toast({
        title: "Erro",
        description: "Dados do paciente não encontrados para gerar o PDF",
        variant: "destructive",
      });
      return;
    }

    setGerandoPdf(true);
    try {
      const { gerarPrescricaoPdf } = await import("./lib/prescricaoPdfService");

      const resultado = await gerarPrescricaoPdf({
        pacienteNome: paciente.nome,
        data: dataPrescricao,
        assinaturaTipo: "digital",
        observacoes: observacoes.trim() || undefined,
        itens: itensValidos.map((item) => ({
          nome: item.medicamentoTextoLivre,
          dosagem: item.dosagem,
          frequencia: item.frequencia,
          duracao: item.duracao,
          orientacoes: item.orientacoes,
        })),
      });

      const pdfBytes =
        resultado.pdfBuffer instanceof Uint8Array
          ? resultado.pdfBuffer
          : new Uint8Array(resultado.pdfBuffer);
      const url = URL.createObjectURL(new Blob([pdfBytes], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resultado.fileName;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF gerado",
        description: "Download concluído com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message ?? "Não foi possível gerar o documento",
        variant: "destructive",
      });
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="data">Data da Prescrição</Label>
            <Input
              id="data"
              type="date"
              value={dataPrescricao}
              onChange={(e) => setDataPrescricao(e.target.value)}
            />
          </div>

          {/* Sugestão com IA */}
          <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
            <Label htmlFor="diagnostico">
              Diagnóstico (para sugestão com IA)
            </Label>
            <div className="flex gap-2">
              <Input
                id="diagnostico"
                placeholder="Ex: Diabetes mellitus tipo 2 descompensado"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
              />
              <Button
                type="button"
                onClick={handleSugerirIA}
                disabled={loadingSugestao || !diagnostico.trim()}
                variant="secondary"
              >
                {loadingSugestao ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Sugerir com IA
              </Button>
            </div>
          </div>

          {/* Medicamentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medicamentos</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerificarInteracoes}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Verificar Interações
                </Button>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Alertas de Interações */}
            {interacoes.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Interações detectadas:</p>
                    {interacoes.map((interacao, idx) => (
                      <div key={idx} className="text-sm">
                        <p>
                          <strong>
                            {interacao.medicamento1} + {interacao.medicamento2}
                          </strong>{" "}
                          ({interacao.gravidade})
                        </p>
                        <p>{interacao.descricao}</p>
                        {interacao.recomendacao && (
                          <p className="italic">→ {interacao.recomendacao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {itens.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Medicamento {index + 1}</span>
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome do Medicamento</Label>
                    <Input
                      placeholder="Ex: Metformina"
                      value={item.medicamentoTextoLivre}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "medicamentoTextoLivre",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Dosagem</Label>
                    <Input
                      placeholder="Ex: 500mg"
                      value={item.dosagem}
                      onChange={(e) =>
                        handleItemChange(index, "dosagem", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Frequência</Label>
                    <Input
                      placeholder="Ex: 2x/dia"
                      value={item.frequencia}
                      onChange={(e) =>
                        handleItemChange(index, "frequencia", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Duração</Label>
                    <Input
                      placeholder="Ex: 30 dias"
                      value={item.duracao}
                      onChange={(e) =>
                        handleItemChange(index, "duracao", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Orientações (opcional)</Label>
                    <Input
                      placeholder="Ex: Tomar com alimentos"
                      value={item.orientacoes}
                      onChange={(e) =>
                        handleItemChange(index, "orientacoes", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações gerais sobre a prescrição"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleGerarPdf}
            disabled={gerandoPdf || criarMutation.isPending}
          >
            {gerandoPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={criarMutation.isPending}
          >
            {criarMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Prescrição"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
