diff --git a/ConsultaDetalhesV2.tsx b/ConsultaDetalhesV2.tsx
index 5c26b6ecc3bd7dc99d81022d6c2b551020bd586b..a11b26912b8644a730c25a5168e6e2703d855c18 100644
--- a/ConsultaDetalhesV2.tsx
+++ b/ConsultaDetalhesV2.tsx
@@ -1,37 +1,36 @@
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
-import { Badge } from "@/components/ui/badge";
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
@@ -103,55 +102,50 @@ export default function ConsultaDetalhesV2() {
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
 
-  const { data: consultasRecentes } = trpc.consultas.getByPaciente.useQuery(
-    { pacienteId: consulta?.pacienteId || 0 },
-    { enabled: isAuthenticated && !!consulta?.pacienteId }
-  );
-
   const { data: bioimpedanciasPaciente, isLoading: carregandoBio } =
     trpc.bioimpedancias.list.useQuery(
       { pacienteId: consulta?.pacienteId || 0 },
       { enabled: isAuthenticated && !!consulta?.pacienteId }
     );
 
   const { data: examesPaciente, isLoading: carregandoExames, refetch: refetchExamesPaciente } =
     trpc.exames.getByPaciente.useQuery(
       { pacienteId: consulta?.pacienteId || 0 },
       { enabled: isAuthenticated && !!consulta?.pacienteId }
     );
 
   const examesNormalizados = useMemo(() => {
     return (examesPaciente || []).map((exame) => {
       let resultados: any[] = [];
       if (Array.isArray(exame.resultados)) {
         resultados = exame.resultados as any[];
       } else if (exame.resultados) {
         try {
           resultados = typeof exame.resultados === "string"
             ? JSON.parse(exame.resultados)
             : (exame.resultados as any);
         } catch {
           resultados = [];
         }
