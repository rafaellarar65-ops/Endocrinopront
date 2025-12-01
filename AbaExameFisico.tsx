import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Check, Loader2, Plus, Trash } from "lucide-react";

interface AbaExameFisicoProps {
  consultaId: number;
}

interface SugestaoExameFisico {
  id: string;
  tipo: "exame_geral" | "exame_sistemas" | "exame_especifico";
  titulo: string;
  textoSugerido: string;
  fundamentacao?: string;
  prioridade?: "alta" | "media" | "baixa";
  pontosAtencao?: string[];
  campos?: { id?: string; label: string; placeholder?: string }[];
}

interface ExameEspecificoCampo {
  id: string;
  titulo: string;
  resultado: string;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "campo";
}

export function AbaExameFisico({ consultaId }: AbaExameFisicoProps) {
  const { data: consulta, refetch: refetchConsulta } =
    trpc.consultas.getById.useQuery({ id: consultaId });

  const { data: sugestoes, refetch: refetchSugestoes } =
    trpc.exameFisico.getSugestoes.useQuery({ consultaId }, {
      enabled: consultaId > 0,
    });

  const atualizarExameFisicoMutation =
    trpc.exameFisico.atualizarExameFisico.useMutation({
      onSuccess: async () => {
        toast.success("Exame físico salvo");
        await refetchConsulta();
      },
      onError: (error) => toast.error(error.message || "Erro ao salvar"),
    });

  const gerarSugestoesMutation = trpc.exameFisico.gerarSugestoes.useMutation({
    onSuccess: async () => {
      toast.success("Sugestões atualizadas");
      await refetchSugestoes();
    },
    onError: (error) => toast.error(error.message || "Erro ao gerar sugestões"),
  });

  const [dadosVitais, setDadosVitais] = useState({
    peso: "",
    altura: "",
    imc: "",
    pressaoArterial: "",
    frequenciaCardiaca: "",
    temperatura: "",
  });
  const [exameGeral, setExameGeral] = useState("");
  const [examePorSistemas, setExamePorSistemas] = useState("");
  const [examesEspecificos, setExamesEspecificos] = useState<ExameEspecificoCampo[]>([]);

  const consultaFinalizada = useMemo(
    () => consulta?.status === "concluida" || consulta?.status === "finalizada",
    [consulta?.status]
  );

  useEffect(() => {
    if (!consulta) return;
    const exameFisico = (consulta.exameFisico as any) || {};
    setDadosVitais({
      peso: exameFisico.peso?.toString?.() || "",
      altura: exameFisico.altura?.toString?.() || "",
      imc: exameFisico.imc?.toString?.() || "",
      pressaoArterial: exameFisico.pressaoArterial || "",
      frequenciaCardiaca: exameFisico.frequenciaCardiaca?.toString?.() || "",
      temperatura: exameFisico.temperatura?.toString?.() || "",
    });
    setExameGeral(exameFisico.exameGeral || "");
    setExamePorSistemas(exameFisico.examePorSistemas || "");
    setExamesEspecificos(exameFisico.examesEspecificos || []);
  }, [consulta]);

  useEffect(() => {
    const peso = parseFloat(dadosVitais.peso);
    const altura = parseFloat(dadosVitais.altura);
    if (peso > 0 && altura > 0) {
      const imc = peso / (altura * altura);
      setDadosVitais((prev) => ({ ...prev, imc: imc.toFixed(1) }));
    }
  }, [dadosVitais.peso, dadosVitais.altura]);

  const handleAplicarSugestao = (sug: SugestaoExameFisico) => {
    if (consultaFinalizada) return;

    if (sug.tipo === "exame_geral") {
      setExameGeral((prev) => (prev ? `${prev}\n\n${sug.textoSugerido}` : sug.textoSugerido));
    } else if (sug.tipo === "exame_sistemas") {
      setExamePorSistemas((prev) =>
        prev ? `${prev}\n\n${sug.textoSugerido}` : sug.textoSugerido
      );
    } else if (sug.tipo === "exame_especifico") {
      const campos = sug.campos?.length
        ? sug.campos
        : [{ id: sug.id, label: sug.titulo, placeholder: sug.textoSugerido }];

      setExamesEspecificos((prev) => {
        const next = [...prev];
        campos.forEach((campo) => {
          const campoId = campo.id || slugify(`${sug.id}-${campo.label}`);
          if (!next.find((c) => c.id === campoId)) {
            next.push({ id: campoId, titulo: campo.label, resultado: campo.placeholder || "" });
          }
        });
        return next;
      });
    }

    toast.success("Sugestão aplicada");
  };

  const handleSalvar = async () => {
    if (!consulta) return;
    await atualizarExameFisicoMutation.mutateAsync({
      id: consulta.id,
      exameFisico: {
        ...dadosVitais,
        exameGeral,
        examePorSistemas,
        examesEspecificos,
      },
    });
  };

  const handleRemoverCampo = (id: string) => {
    if (consultaFinalizada) return;
    setExamesEspecificos((prev) => prev.filter((campo) => campo.id !== id));
  };

  if (!consulta) {
    return (
      <div className="text-center py-12 text-gray-500">
        Consulta não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Exame Físico</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => gerarSugestoesMutation.mutate({ consultaId })}
            disabled={gerarSugestoesMutation.isPending || consultaFinalizada}
          >
            {gerarSugestoesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando sugestões...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Atualizar com IA
              </>
            )}
          </Button>

          <Button
            onClick={handleSalvar}
            disabled={atualizarExameFisicoMutation.isPending || consultaFinalizada}
            variant="default"
          >
            {atualizarExameFisicoMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvar exame físico
              </>
            )}
          </Button>
        </div>
      </div>

      {consultaFinalizada && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded">
          Consulta finalizada: edição bloqueada.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados vitais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input
              id="peso"
              type="number"
              value={dadosVitais.peso}
              onChange={(e) => setDadosVitais({ ...dadosVitais, peso: e.target.value })}
              disabled={consultaFinalizada}
            />
          </div>
          <div>
            <Label htmlFor="altura">Altura (m)</Label>
            <Input
              id="altura"
              type="number"
              step="0.01"
              value={dadosVitais.altura}
              onChange={(e) => setDadosVitais({ ...dadosVitais, altura: e.target.value })}
              disabled={consultaFinalizada}
            />
          </div>
          <div>
            <Label htmlFor="imc">IMC</Label>
            <Input id="imc" value={dadosVitais.imc} disabled />
          </div>
          <div>
            <Label htmlFor="pa">Pressão arterial</Label>
            <Input
              id="pa"
              value={dadosVitais.pressaoArterial}
              onChange={(e) => setDadosVitais({ ...dadosVitais, pressaoArterial: e.target.value })}
              disabled={consultaFinalizada}
            />
          </div>
          <div>
            <Label htmlFor="fc">Frequência cardíaca</Label>
            <Input
              id="fc"
              value={dadosVitais.frequenciaCardiaca}
              onChange={(e) =>
                setDadosVitais({ ...dadosVitais, frequenciaCardiaca: e.target.value })
              }
              disabled={consultaFinalizada}
            />
          </div>
          <div>
            <Label htmlFor="temp">Temperatura</Label>
            <Input
              id="temp"
              value={dadosVitais.temperatura}
              onChange={(e) => setDadosVitais({ ...dadosVitais, temperatura: e.target.value })}
              disabled={consultaFinalizada}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exame geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={exameGeral}
            onChange={(e) => setExameGeral(e.target.value)}
            rows={5}
            placeholder="Descreva o exame geral"
            disabled={consultaFinalizada}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exame por sistemas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={examePorSistemas}
            onChange={(e) => setExamePorSistemas(e.target.value)}
            rows={5}
            placeholder="Descreva o exame por sistemas"
            disabled={consultaFinalizada}
          />
        </CardContent>
      </Card>

      {examesEspecificos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exames específicos sugeridos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examesEspecificos.map((campo) => (
              <div key={campo.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{campo.titulo}</Label>
                  {!consultaFinalizada && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverCampo(campo.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={campo.resultado}
                  onChange={(e) =>
                    setExamesEspecificos((prev) =>
                      prev.map((c) =>
                        c.id === campo.id ? { ...c, resultado: e.target.value } : c
                      )
                    )
                  }
                  disabled={consultaFinalizada}
                  placeholder="Descreva achados específicos"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sugestoes && sugestoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sugestões da IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sugestoes.map((sug: SugestaoExameFisico) => (
              <div key={sug.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sug.prioridade && (
                      <Badge
                        variant="outline"
                        className={
                          sug.prioridade === "alta"
                            ? "border-red-300 text-red-700"
                            : sug.prioridade === "media"
                              ? "border-yellow-300 text-yellow-700"
                              : "border-green-300 text-green-700"
                        }
                      >
                        {sug.prioridade}
                      </Badge>
                    )}
                    <span className="font-semibold">{sug.titulo}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAplicarSugestao(sug)}
                    disabled={consultaFinalizada}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Aplicar
                  </Button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{sug.textoSugerido}</p>
                {sug.fundamentacao && (
                  <p className="text-xs text-gray-500">{sug.fundamentacao}</p>
                )}
                {sug.pontosAtencao && sug.pontosAtencao.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {sug.pontosAtencao.map((ponto, idx) => (
                      <li key={idx}>{ponto}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AbaExameFisico;
