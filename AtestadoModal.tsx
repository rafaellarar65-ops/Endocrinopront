import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { atestadoSchema, type AtestadoSchema } from "./atestados.types";
import { generateAtestadoPdf } from "./lib/atestadoPdfService";

type AtestadoField = keyof AtestadoSchema;

interface AtestadoModalProps {
  open: boolean;
  onClose: () => void;
  pacienteNome: string;
  pacienteIdade?: number;
  cidSugerido?: string;
}

export function AtestadoModal({
  open,
  onClose,
  pacienteNome,
  pacienteIdade,
  cidSugerido,
}: AtestadoModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<AtestadoField, string>>>({});
  const [formData, setFormData] = useState<AtestadoSchema>({
    pacienteNome,
    pacienteIdade: pacienteIdade ?? 0,
    dataEmissao: new Date().toISOString().split("T")[0],
    cid: cidSugerido ?? "",
    diagnostico: "",
    recomendacoes: "Repouso domiciliar.",
    afastamentoDias: 3,
    medicoNome: "",
    crm: "",
    observacoes: "",
  });

  const requiredFields = useMemo(
    () => [
      "pacienteNome",
      "pacienteIdade",
      "dataEmissao",
      "cid",
      "diagnostico",
      "recomendacoes",
      "afastamentoDias",
      "medicoNome",
      "crm",
    ] as AtestadoField[],
    []
  );

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        pacienteNome,
        pacienteIdade: pacienteIdade ?? prev.pacienteIdade,
        cid: cidSugerido ?? prev.cid,
      }));
      setErrors({});
    }
  }, [open, pacienteIdade, pacienteNome, cidSugerido]);

  const handleChange = (field: AtestadoField, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const downloadPdf = (payload: ReturnType<typeof generateAtestadoPdf>) => {
    const blob = new Blob([payload.content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = payload.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = () => {
    const parseResult = atestadoSchema.safeParse({
      ...formData,
    });

    if (!parseResult.success) {
      const validationErrors: Partial<Record<AtestadoField, string>> = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as AtestadoField;
        validationErrors[field] = issue.message;
      });
      setErrors(validationErrors);
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos marcados em vermelho.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const payload = generateAtestadoPdf(parseResult.data);
      downloadPdf(payload);
      toast({
        title: "Atestado gerado",
        description: `${payload.metadata.paciente} - ${payload.metadata.cid}`,
      });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileCheck2 className="h-5 w-5 text-blue-600" />
            Emitir atestado médico
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Preencha os campos obrigatórios para gerar o documento com os dados clínicos do paciente.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="pacienteNome">Paciente</Label>
            <Input
              id="pacienteNome"
              value={formData.pacienteNome}
              onChange={(e) => handleChange("pacienteNome", e.target.value)}
              className={errors.pacienteNome ? "border-destructive" : ""}
            />
            {errors.pacienteNome && (
              <p className="text-xs text-destructive">{errors.pacienteNome}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="pacienteIdade">Idade</Label>
            <Input
              id="pacienteIdade"
              type="number"
              value={formData.pacienteIdade}
              onChange={(e) => handleChange("pacienteIdade", Number(e.target.value))}
              className={errors.pacienteIdade ? "border-destructive" : ""}
            />
            {errors.pacienteIdade && (
              <p className="text-xs text-destructive">{errors.pacienteIdade}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="dataEmissao">Data de emissão</Label>
            <Input
              id="dataEmissao"
              type="date"
              value={formData.dataEmissao}
              onChange={(e) => handleChange("dataEmissao", e.target.value)}
              className={errors.dataEmissao ? "border-destructive" : ""}
            />
            {errors.dataEmissao && (
              <p className="text-xs text-destructive">{errors.dataEmissao}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cid">CID</Label>
            <Input
              id="cid"
              placeholder="Ex: M54.5"
              value={formData.cid}
              onChange={(e) => handleChange("cid", e.target.value)}
              className={errors.cid ? "border-destructive" : ""}
            />
            {errors.cid && <p className="text-xs text-destructive">{errors.cid}</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              rows={2}
              value={formData.diagnostico}
              onChange={(e) => handleChange("diagnostico", e.target.value)}
              className={errors.diagnostico ? "border-destructive" : ""}
            />
            {errors.diagnostico && (
              <p className="text-xs text-destructive">{errors.diagnostico}</p>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="recomendacoes">Recomendações</Label>
            <Textarea
              id="recomendacoes"
              rows={2}
              value={formData.recomendacoes}
              onChange={(e) => handleChange("recomendacoes", e.target.value)}
              className={errors.recomendacoes ? "border-destructive" : ""}
            />
            {errors.recomendacoes && (
              <p className="text-xs text-destructive">{errors.recomendacoes}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="afastamentoDias">Dias de afastamento</Label>
            <Input
              id="afastamentoDias"
              type="number"
              min={1}
              value={formData.afastamentoDias}
              onChange={(e) => handleChange("afastamentoDias", Number(e.target.value))}
              className={errors.afastamentoDias ? "border-destructive" : ""}
            />
            {errors.afastamentoDias && (
              <p className="text-xs text-destructive">{errors.afastamentoDias}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="crm">CRM</Label>
            <Input
              id="crm"
              value={formData.crm}
              onChange={(e) => handleChange("crm", e.target.value)}
              className={errors.crm ? "border-destructive" : ""}
            />
            {errors.crm && <p className="text-xs text-destructive">{errors.crm}</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="medicoNome">Médico responsável</Label>
            <Input
              id="medicoNome"
              value={formData.medicoNome}
              onChange={(e) => handleChange("medicoNome", e.target.value)}
              className={errors.medicoNome ? "border-destructive" : ""}
            />
            {errors.medicoNome && (
              <p className="text-xs text-destructive">{errors.medicoNome}</p>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="observacoes">Observações adicionais</Label>
            <Textarea
              id="observacoes"
              rows={2}
              value={formData.observacoes ?? ""}
              onChange={(e) => handleChange("observacoes", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {requiredFields.map((field) => (
            <span key={field} className="px-2 py-1 rounded-full bg-muted">
              {field}
            </span>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
