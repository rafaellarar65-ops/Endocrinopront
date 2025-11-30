import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pacientes - Tabela principal de pacientes
 */
export const pacientes = mysqlTable("pacientes", {
  id: int("id").autoincrement().primaryKey(),
  medicoId: int("medicoId").notNull(), // Referência ao médico responsável
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  dataNascimento: timestamp("dataNascimento"),
  sexo: mysqlEnum("sexo", ["masculino", "feminino", "outro"]),
  contatoWhatsapp: varchar("contatoWhatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  dadosEssenciais: json("dadosEssenciais"), // JSONB para dados flexíveis
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

/**
 * Consultas - Registro de consultas médicas
 */
export const consultas = mysqlTable("consultas", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  medicoId: int("medicoId").notNull(),
  dataHora: timestamp("dataHora").notNull(),
  audioPath: varchar("audioPath", { length: 500 }), // Caminho do áudio no S3
  audioUrl: varchar("audioUrl", { length: 500 }), // URL do áudio
  anamnese: json("anamnese"), // JSON estruturado da anamnese
  exameFisico: json("exameFisico"), // JSON do exame físico
  hipotesesDiagnosticas: text("hipotesesDiagnosticas"),
  conduta: text("conduta"),
  observacoes: text("observacoes"),
  resumo: json("resumo"), // JSON com resumo estruturado da consulta gerado por IA
  resumoEvolutivo: text("resumoEvolutivo"), // Resumo consolidado evolutivo (resumo anterior + dados da consulta atual)
  sugestoesExameFisico: json("sugestoesExameFisico"), // JSON com sugestões de IA para exame físico
  status: mysqlEnum("status", ["agendada", "em_andamento", "concluida", "cancelada"]).default("agendada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consulta = typeof consultas.$inferSelect;
export type InsertConsulta = typeof consultas.$inferInsert;

/**
 * Exames Laboratoriais - Resultados de exames
 */
export const examesLaboratoriais = mysqlTable("examesLaboratoriais", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  consultaId: int("consultaId"), // Opcional - pode estar vinculado a uma consulta
  dataExame: timestamp("dataExame").notNull(),
  tipo: varchar("tipo", { length: 100 }), // Tipo do exame (hemograma, glicemia, etc)
  laboratorio: varchar("laboratorio", { length: 255 }),
  resultados: json("resultados"), // JSON com os resultados estruturados
  pdfPath: varchar("pdfPath", { length: 500 }), // Caminho do PDF no S3
  pdfUrl: varchar("pdfUrl", { length: 500 }), // URL do PDF
  imagemPath: varchar("imagemPath", { length: 500 }), // Caminho da imagem no S3
  imagemUrl: varchar("imagemUrl", { length: 500 }), // URL da imagem
  mimeType: varchar("mimeType", { length: 255 }), // Tipo do arquivo enviado (PDF/Imagem)
  fileName: varchar("fileName", { length: 255 }), // Nome original do arquivo
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExameLaboratorial = typeof examesLaboratoriais.$inferSelect;
export type InsertExameLaboratorial = typeof examesLaboratoriais.$inferInsert;

/**
 * Bioimpedância - Resultados de bioimpedância
 */
export const bioimpedancias = mysqlTable("bioimpedancias", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  consultaId: int("consultaId"), // Opcional
  dataAvaliacao: timestamp("dataAvaliacao").notNull(),
  resultados: json("resultados"), // JSON com todos os dados da bioimpedância
  interpretacaoIA: text("interpretacaoIA"), // Análise interpretativa da IA
  pdfPath: varchar("pdfPath", { length: 500 }),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  xlsPath: varchar("xlsPath", { length: 500 }), // Arquivo original XLS
  xlsUrl: varchar("xlsUrl", { length: 500 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bioimpedancia = typeof bioimpedancias.$inferSelect;
export type InsertBioimpedancia = typeof bioimpedancias.$inferInsert;

/**
 * Escores Clínicos - Cálculos de escores (PREVENT, FRAX, etc)
 */
export const escoresClinicos = mysqlTable("escoresClinicos", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  consultaId: int("consultaId"),
  tipoEscore: varchar("tipoEscore", { length: 50 }).notNull(), // PREVENT, FRAX, etc
  dataCalculo: timestamp("dataCalculo").notNull(),
  parametros: json("parametros"), // Parâmetros usados no cálculo
  resultado: json("resultado"), // Resultado do escore
  interpretacao: text("interpretacao"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EscoreClinico = typeof escoresClinicos.$inferSelect;
export type InsertEscoreClinico = typeof escoresClinicos.$inferInsert;

/**
 * Planos Terapêuticos - Planos de tratamento
 */
export const planosTerapeuticos = mysqlTable("planosTerapeuticos", {
  id: int("id").autoincrement().primaryKey(),
  consultaId: int("consultaId").notNull(),
  pacienteId: int("pacienteId").notNull(),
  versaoMedico: text("versaoMedico"), // Versão técnica para o médico
  versaoPaciente: text("versaoPaciente"), // Versão simplificada para o paciente
  diagnosticosConfirmados: json("diagnosticosConfirmados"),
  diagnosticosProvaveis: json("diagnosticosProvaveis"),
  condutas: json("condutas"),
  metasSMART: json("metasSMART"),
  sinaisAlarme: json("sinaisAlarme"),
  recomendacoes: json("recomendacoes"),
  pdfMedicoPath: varchar("pdfMedicoPath", { length: 500 }),
  pdfMedicoUrl: varchar("pdfMedicoUrl", { length: 500 }),
  pdfPacientePath: varchar("pdfPacientePath", { length: 500 }),
  pdfPacienteUrl: varchar("pdfPacienteUrl", { length: 500 }),
  statusEnvioWhatsapp: mysqlEnum("statusEnvioWhatsapp", ["pendente", "enviado", "erro"]).default("pendente"),
  dataEnvioWhatsapp: timestamp("dataEnvioWhatsapp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanoTerapeutico = typeof planosTerapeuticos.$inferSelect;
export type InsertPlanoTerapeutico = typeof planosTerapeuticos.$inferInsert;

/**
 * Templates - Templates personalizados de atendimento
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  medicoId: int("medicoId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["anamnese", "exame_fisico", "fluxo_doenca"]).notNull(),
  patologia: varchar("patologia", { length: 255 }), // Ex: DM2, Hipogonadismo, etc
  definicao: json("definicao"), // JSON com a estrutura do template
  documentosReferencia: json("documentosReferencia"), // URLs de documentos anexados
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Documentos - Documentos gerados automaticamente
 */
export const documentos = mysqlTable("documentos", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  consultaId: int("consultaId"),
  medicoId: int("medicoId").notNull(),
  tipo: mysqlEnum("tipo", ["receituario", "atestado", "declaracao", "relatorio", "encaminhamento", "laudo"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  conteudoHTML: text("conteudoHTML"), // Conteúdo em HTML/Markdown
  pdfPath: varchar("pdfPath", { length: 500 }),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  status: mysqlEnum("status", ["rascunho", "finalizado"]).default("rascunho").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

/**
 * Indicadores Metabólicos - Consolidação de indicadores
 */
export const indicadoresMetabolicos = mysqlTable("indicadoresMetabolicos", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  dataReferencia: timestamp("dataReferencia").notNull(),
  peso: int("peso"), // em gramas
  altura: int("altura"), // em centímetros
  imc: int("imc"), // IMC * 100 para evitar decimais
  circunferenciaAbdominal: int("circunferenciaAbdominal"), // em milímetros
  pressaoArterialSistolica: int("pressaoArterialSistolica"),
  pressaoArterialDiastolica: int("pressaoArterialDiastolica"),
  glicemiaJejum: int("glicemiaJejum"), // mg/dL
  hba1c: int("hba1c"), // HbA1c * 10
  colesterolTotal: int("colesterolTotal"), // mg/dL
  ldl: int("ldl"), // mg/dL
  hdl: int("hdl"), // mg/dL
  triglicerideos: int("triglicerideos"), // mg/dL
  dadosAdicionais: json("dadosAdicionais"), // Outros indicadores
  fontesDados: json("fontesDados"), // Referências aos dados originais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IndicadorMetabolico = typeof indicadoresMetabolicos.$inferSelect;
export type InsertIndicadorMetabolico = typeof indicadoresMetabolicos.$inferInsert;

/**
 * AI Audit Logs - Logs de auditoria de chamadas de IA
 */
export const aiAuditLogs = mysqlTable("ai_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId"),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  success: boolean("success").notNull(),
  duration: int("duration").notNull(), // milissegundos
  tokensUsed: int("tokensUsed"),
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIAuditLog = typeof aiAuditLogs.$inferSelect;
export type InsertAIAuditLog = typeof aiAuditLogs.$inferInsert;


/**
 * Módulo 18: Prescrições Médicas Inteligentes
 */

// Tabela de medicamentos (banco pré-cadastrado)
export const medicamentos = mysqlTable("medicamentos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  principioAtivo: varchar("principio_ativo", { length: 200 }).notNull(),
  dosagemPadrao: varchar("dosagem_padrao", { length: 100 }).notNull(),
  via: varchar("via", { length: 30 }).notNull(),
  formaFarmaceutica: varchar("forma_farmaceutica", { length: 100 }).notNull(),
  ativo: boolean("ativo").notNull().default(true),
});

export type Medicamento = typeof medicamentos.$inferSelect;
export type InsertMedicamento = typeof medicamentos.$inferInsert;

// Tabela de prescrições
export const prescricoes = mysqlTable("prescricoes", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("paciente_id").notNull().references(() => pacientes.id),
  consultaId: int("consulta_id").references(() => consultas.id),
  dataPrescricao: date("data_prescricao").notNull(),
  observacoes: text("observacoes"),
  arquivoPdfUrl: text("arquivo_pdf_url"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export type Prescricao = typeof prescricoes.$inferSelect;
export type InsertPrescricao = typeof prescricoes.$inferInsert;

// Tabela de itens de prescrição
export const itensPrescricao = mysqlTable("itens_prescricao", {
  id: int("id").autoincrement().primaryKey(),
  prescricaoId: int("prescricao_id").notNull().references(() => prescricoes.id),
  medicamentoId: int("medicamento_id").references(() => medicamentos.id),
  medicamentoTextoLivre: varchar("medicamento_texto_livre", { length: 200 }),
  dosagem: varchar("dosagem", { length: 100 }).notNull(),
  frequencia: varchar("frequencia", { length: 100 }).notNull(),
  duracao: varchar("duracao", { length: 100 }).notNull(),
  orientacoes: text("orientacoes"),
  ordem: int("ordem").notNull().default(0),
});

export type ItemPrescricao = typeof itensPrescricao.$inferSelect;
export type InsertItemPrescricao = typeof itensPrescricao.$inferInsert;
