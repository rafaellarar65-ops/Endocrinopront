import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2 } from "lucide-react";
import { laudoSchema, type Laudo, type LaudoAchado, type LaudoCarimbo } from "./laudoSchema";

interface ModalNovoLaudoProps {
  open: boolean;
  onClose: () => void;
  pacienteId: number;
  pacienteNome: string;
  onSubmit?: (laudo: Laudo) => void;
}

export function ModalNovoLaudo({
  open,
  onClose,
  pacienteId,
  pacienteNome,
  onSubmit,
}: ModalNovoLaudoProps) {
  const [dataEmissao, setDataEmissao] = useState(
    useMemo(() => new Date().toISOString().split("T")[0], [])
  );
  const [achados, setAchados] = useState<LaudoAchado[]>([
    { titulo: "", descricao: "" },
  ]);
  const [conclusao, setConclusao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carimbo, setCarimbo] = useState<LaudoCarimbo>({
    profissional: "",
    registro: "",
    assinaturaDigital: "",
  });
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = () => {
    setDataEmissao(new Date().toISOString().split("T")[0]);
    setAchados([{ titulo: "", descricao: "" }]);
    setConclusao("");
    setObservacoes("");
    setCarimbo({ profissional: "", registro: "", assinaturaDigital: "" });
    setErrors([]);
  };

  const handleAddAchado = () => {
    setAchados([...achados, { titulo: "", descricao: "" }]);
  };

  const handleRemoveAchado = (index: number) => {
    if (achados.length === 1) return;
    setAchados(achados.filter((_, i) => i !== index));
  };

  const handleChangeAchado = (index: number, field: keyof LaudoAchado, value: string) => {
    const updated = [...achados];
    updated[index] = { ...updated[index], [field]: value };
    setAchados(updated);
  };

  const handleSubmit = () => {
    const laudoPayload: Laudo = {
      paciente: { id: pacienteId, nome: pacienteNome },
      dataEmissao,
      achados,
      conclusao,
      carimbo,
      observacoes: observacoes.trim() || undefined,
    };

    const parsed = laudoSchema.safeParse(laudoPayload);
    if (!parsed.success) {
      setErrors(parsed.error.errors.map((e) => e.message));
      return;
    }

    onSubmit?.(parsed.data);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo laudo clínico</DialogTitle>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Revise os campos</AlertTitle>
            <AlertDescription>
              <ul className="list-disc ml-4 space-y-1">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data">Data de emissão</Label>
            <Input
              id="data"
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Achados</Label>
            <div className="space-y-3">
              {achados.map((achado, index) => (
                <div
                  key={index}
                  className="rounded-md border border-slate-200 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Achado #{index + 1}</Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAchado(index)}
                      disabled={achados.length === 1}
                      aria-label="Remover achado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Título do achado"
                    value={achado.titulo}
                    onChange={(e) => handleChangeAchado(index, "titulo", e.target.value)}
                  />
                  <Textarea
                    placeholder="Descrição detalhada"
                    value={achado.descricao}
                    onChange={(e) => handleChangeAchado(index, "descricao", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={handleAddAchado}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar achado
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conclusao">Conclusão</Label>
            <Textarea
              id="conclusao"
              placeholder="Síntese interpretativa do quadro"
              value={conclusao}
              onChange={(e) => setConclusao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Notas complementares, orientações, limitações"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="profissional">Responsável</Label>
              <Input
                id="profissional"
                placeholder="Nome do profissional"
                value={carimbo.profissional}
                onChange={(e) => setCarimbo({ ...carimbo, profissional: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro">Registro</Label>
              <Input
                id="registro"
                placeholder="CRM/UF ou outro registro"
                value={carimbo.registro}
                onChange={(e) => setCarimbo({ ...carimbo, registro: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assinatura">Assinatura/Carimbo</Label>
              <Input
                id="assinatura"
                placeholder="Assinatura digital ou carimbo"
                value={carimbo.assinaturaDigital}
                onChange={(e) =>
                  setCarimbo({ ...carimbo, assinaturaDigital: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Gerar laudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
