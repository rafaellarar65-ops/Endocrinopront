diff --git a/PacienteDetalhes.tsx b/PacienteDetalhes.tsx
index 2345ab3c0e94b2ca53f81c2253ab3517ff504dab..fff8027537b8f3995d2a75812508c588586a73bd 100644
--- a/PacienteDetalhes.tsx
+++ b/PacienteDetalhes.tsx
@@ -15,51 +15,51 @@ import {
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
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { ExameResultadosTable } from "./ExameResultadosTable";
 import { toast } from "sonner";
 import { Textarea } from "@/components/ui/textarea";
 import EvolutionChart from "./EvolutionChart";
 import { montarSeriesEvolucao } from "./examesUtils";
 
 export default function PacienteDetalhes() {
-  const { user, loading: authLoading, isAuthenticated } = useAuth();
+  const { loading: authLoading, isAuthenticated } = useAuth();
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
