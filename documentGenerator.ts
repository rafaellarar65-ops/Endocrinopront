diff --git a/documentGenerator.ts b/documentGenerator.ts
index 7260328c27ce21781371143c73ed9f04098aa41b..2336e414f39d7760b95b8046ec8283f3e145da1f 100644
--- a/documentGenerator.ts
+++ b/documentGenerator.ts
@@ -1,37 +1,36 @@
 /**
  * Serviço para gerar documentos médicos (receituários, bioimpedância, etc.)
  */
 
 import {
-  fillReceituarioSVG,
   fillBioimpedanciaSVG,
   convertSVGtoPDF,
-  type ReceituarioData,
   type BioimpedanciaData,
 } from "./svgProcessor";
 import { storagePut } from "./storage";
+import { gerarPrescricaoPdf } from "./lib/prescricaoPdfService";
 
 export interface GenerateReceituarioParams {
   pacienteNome: string;
   data: string;
   assinaturaTipo?: "digital" | "manual";
   medicamentos: Array<{
     nome: string;
     dosagem: string;
     via: string;
     posologia: string;
     duracao: string;
   }>;
   instrucoesAdicionais?: string;
 }
 
 export interface GenerateBioimpedanciaParams {
   paciente: {
     nome: string;
     nascimento: string;
     idade: number;
     genero: string;
   };
   exame: {
     data: string;
     hora: string;
@@ -56,64 +55,68 @@ export interface GenerateBioimpedanciaParams {
 
 /**
  * Permite reusar a conversão de HTML/SVG para PDF em outros serviços
  */
 export { convertSVGtoPDF };
 
 /**
  * Faz upload de um buffer PDF para o storage padrão e retorna URL e path
  */
 export async function uploadPdfBuffer(
   fileKey: string,
   pdfBuffer: Buffer
 ): Promise<{ pdfUrl: string; pdfPath: string }> {
   const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");
 
   return { pdfUrl, pdfPath: fileKey };
 }
 
 /**
  * Gera receituário em PDF e faz upload para S3
  */
 export async function generateReceituarioPDF(
   params: GenerateReceituarioParams,
   pacienteId: number
 ): Promise<{ pdfUrl: string; pdfPath: string }> {
-  // Preparar dados para o template
-  const data: ReceituarioData = {
-    nomePaciente: params.pacienteNome,
-    data: params.data,
-    assinaturaTipo: params.assinaturaTipo,
-    medicamentos: params.medicamentos,
-    instrucoesAdicionais: params.instrucoesAdicionais,
-  };
-
-  // Preencher SVG com dados
-  const svgContent = await fillReceituarioSVG(data);
-
-  // Converter para PDF
-  const pdfBuffer = await convertSVGtoPDF(svgContent);
+  const { pdfBuffer } = await gerarPrescricaoPdf(
+    {
+      pacienteNome: params.pacienteNome,
+      data: params.data,
+      assinaturaTipo: params.assinaturaTipo,
+      itens: params.medicamentos.map((medicamento) => ({
+        nome: medicamento.nome,
+        dosagem: medicamento.dosagem,
+        via: medicamento.via,
+        frequencia: medicamento.posologia,
+        duracao: medicamento.duracao,
+      })),
+      observacoes: params.instrucoesAdicionais,
+    },
+    {
+      converter: convertSVGtoPDF,
+    }
+  );
 
   // Upload para S3
   const timestamp = Date.now();
   const fileName = `receituario-${pacienteId}-${timestamp}.pdf`;
   const fileKey = `documentos/${pacienteId}/${fileName}`;
 
   const { url: pdfUrl } = await storagePut(fileKey, pdfBuffer, "application/pdf");
 
   return {
     pdfUrl,
     pdfPath: fileKey,
   };
 }
 
 /**
  * Gera relatório de bioimpedância em PDF e faz upload para S3
  */
 export async function generateBioimpedanciaPDF(
   params: GenerateBioimpedanciaParams,
   pacienteId: number
 ): Promise<{ pdfUrl: string; pdfPath: string }> {
   // Preparar dados para o template
   const data: BioimpedanciaData = {
     nome: params.paciente.nome,
     nascimento: params.paciente.nascimento,
