import { eq, and, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  pacientes,
  consultas,
  examesLaboratoriais,
  bioimpedancias,
  escoresClinicos,
  escoreModulos,
  planosTerapeuticos,
  templates,
  documentos,
  indicadoresMetabolicos,
  medicamentos,
  prescricoes,
  itensPrescricao,
  type Paciente,
  type InsertPaciente,
  type Consulta,
  type InsertConsulta,
  type ExameLaboratorial,
  type InsertExameLaboratorial,
  type Bioimpedancia,
  type InsertBioimpedancia,
  type EscoreClinico,
  type InsertEscoreClinico,
  type EscoreModulo,
  type InsertEscoreModulo,
  type PlanoTerapeutico,
  type InsertPlanoTerapeutico,
  type Template,
  type InsertTemplate,
  type Documento,
  type InsertDocumento,
  type IndicadorMetabolico,
  type InsertIndicadorMetabolico,
} from "./schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== PACIENTES ==========

export async function createPaciente(data: InsertPaciente): Promise<Paciente> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pacientes).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(pacientes).where(eq(pacientes.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getPacienteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPacientesByMedico(medicoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pacientes)
    .where(and(eq(pacientes.medicoId, medicoId), eq(pacientes.ativo, true)))
    .orderBy(desc(pacientes.updatedAt));
}

export async function updatePaciente(id: number, data: Partial<InsertPaciente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pacientes).set(data).where(eq(pacientes.id, id));
  return await getPacienteById(id);
}

export async function searchPacientes(medicoId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(pacientes)
    .where(
      and(
        eq(pacientes.medicoId, medicoId),
        eq(pacientes.ativo, true),
        sql`(${pacientes.nome} LIKE ${`%${searchTerm}%`} OR ${pacientes.cpf} LIKE ${`%${searchTerm}%`})`
      )
    )
    .orderBy(desc(pacientes.updatedAt));
}

// ========== CONSULTAS ==========

export async function createConsulta(data: InsertConsulta): Promise<Consulta> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(consultas).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(consultas).where(eq(consultas.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getConsultaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(consultas).where(eq(consultas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getConsultasByMedico(medicoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consultas)
    .where(eq(consultas.medicoId, medicoId))
    .orderBy(desc(consultas.dataHora));
}

export async function getConsultasRecentes(medicoId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consultas)
    .where(eq(consultas.medicoId, medicoId))
    .orderBy(desc(consultas.dataHora))
    .limit(limit);
}

export async function getConsultasEmAberto(medicoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consultas)
    .where(and(
      eq(consultas.medicoId, medicoId),
      or(
        eq(consultas.status, "agendada"),
        eq(consultas.status, "em_andamento")
      )
    ))
    .orderBy(desc(consultas.dataHora));
}

export async function getConsultasByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consultas)
    .where(eq(consultas.pacienteId, pacienteId))
    .orderBy(desc(consultas.dataHora));
}

export async function updateConsulta(id: number, data: Partial<InsertConsulta>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(consultas).set(data).where(eq(consultas.id, id));
  return await getConsultaById(id);
}

// ========== EXAMES LABORATORIAIS ==========

export async function createExameLaboratorial(data: InsertExameLaboratorial): Promise<ExameLaboratorial> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(examesLaboratoriais).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(examesLaboratoriais).where(eq(examesLaboratoriais.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function updateExameLaboratorial(id: number, data: Partial<InsertExameLaboratorial>): Promise<ExameLaboratorial | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(examesLaboratoriais).set(data).where(eq(examesLaboratoriais.id, id));

  const updated = await db.select().from(examesLaboratoriais).where(eq(examesLaboratoriais.id, id)).limit(1);
  return updated[0];
}

export async function deleteExameLaboratorial(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(examesLaboratoriais).where(eq(examesLaboratoriais.id, id));
  return (result[0] as any)?.affectedRows > 0;
}

export async function getExamesByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(examesLaboratoriais)
    .where(eq(examesLaboratoriais.pacienteId, pacienteId))
    .orderBy(desc(examesLaboratoriais.dataExame));
}

// ========== BIOIMPEDÂNCIA ==========

export async function createBioimpedancia(data: InsertBioimpedancia): Promise<Bioimpedancia> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bioimpedancias).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(bioimpedancias).where(eq(bioimpedancias.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getBioimpedanciasByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bioimpedancias)
    .where(eq(bioimpedancias.pacienteId, pacienteId))
    .orderBy(desc(bioimpedancias.dataAvaliacao));
}

export async function getAllBioimpedancias(limit: number, offset: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    bioimpedancia: bioimpedancias,
    paciente: pacientes,
  })
    .from(bioimpedancias)
    .leftJoin(pacientes, eq(bioimpedancias.pacienteId, pacientes.id))
    .orderBy(desc(bioimpedancias.dataAvaliacao))
    .limit(limit)
    .offset(offset);
}

export async function countBioimpedancias() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(bioimpedancias);
  
  return Number(result[0]?.count || 0);
}

// ========== ESCORES CLÍNICOS ==========

export async function createEscoreClinico(data: InsertEscoreClinico): Promise<EscoreClinico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(escoresClinicos).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(escoresClinicos).where(eq(escoresClinicos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getEscoresByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(escoresClinicos)
    .where(eq(escoresClinicos.pacienteId, pacienteId))
    .orderBy(desc(escoresClinicos.dataCalculo));
}

// ========== CATÁLOGO DE ESCORES ==========

export async function createEscoreModulo(data: InsertEscoreModulo): Promise<EscoreModulo> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(escoreModulos).values(data);
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(escoreModulos).where(eq(escoreModulos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function listEscoreModulos(): Promise<EscoreModulo[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(escoreModulos).orderBy(desc(escoreModulos.createdAt));
}

// ========== PLANOS TERAPÊUTICOS ==========

export async function createPlanoTerapeutico(data: InsertPlanoTerapeutico): Promise<PlanoTerapeutico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(planosTerapeuticos).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(planosTerapeuticos).where(eq(planosTerapeuticos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getPlanosByConsulta(consultaId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(planosTerapeuticos)
    .where(eq(planosTerapeuticos.consultaId, consultaId))
    .orderBy(desc(planosTerapeuticos.createdAt));
}

export async function updatePlanoTerapeutico(id: number, data: Partial<InsertPlanoTerapeutico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(planosTerapeuticos).set(data).where(eq(planosTerapeuticos.id, id));
  const result = await db.select().from(planosTerapeuticos).where(eq(planosTerapeuticos.id, id)).limit(1);
  return result[0];
}

// ========== TEMPLATES ==========

export async function createTemplate(data: InsertTemplate): Promise<Template> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(templates).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(templates).where(eq(templates.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getTemplatesByMedico(medicoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(templates)
    .where(and(eq(templates.medicoId, medicoId), eq(templates.ativo, true)))
    .orderBy(desc(templates.updatedAt));
}

export async function updateTemplate(id: number, data: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(templates).set(data).where(eq(templates.id, id));
  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result[0];
}

// ========== DOCUMENTOS ==========

export async function createDocumento(data: InsertDocumento): Promise<Documento> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documentos).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(documentos).where(eq(documentos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getDocumentosByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documentos)
    .where(eq(documentos.pacienteId, pacienteId))
    .orderBy(desc(documentos.createdAt));
}

export async function updateDocumento(id: number, data: Partial<InsertDocumento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(documentos).set(data).where(eq(documentos.id, id));
  const result = await db.select().from(documentos).where(eq(documentos.id, id)).limit(1);
  return result[0];
}

// ========== INDICADORES METABÓLICOS ==========

export async function createIndicadorMetabolico(data: InsertIndicadorMetabolico): Promise<IndicadorMetabolico> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(indicadoresMetabolicos).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(indicadoresMetabolicos).where(eq(indicadoresMetabolicos.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getIndicadoresByPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(indicadoresMetabolicos)
    .where(eq(indicadoresMetabolicos.pacienteId, pacienteId))
    .orderBy(desc(indicadoresMetabolicos.dataReferencia));
}


/**
 * Módulo 18: Helpers de Prescrições Médicas
 */

import { inArray } from "drizzle-orm";

export async function criarPrescricaoComItens(params: {
  pacienteId: number;
  consultaId?: number;
  dataPrescricao: Date;
  observacoes?: string;
  itens: Array<{
    medicamentoId?: number;
    medicamentoTextoLivre?: string;
    dosagem: string;
    frequencia: string;
    duracao: string;
    orientacoes?: string;
  }>;
  arquivoPdfUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.transaction(async (tx) => {
    const result = await tx
      .insert(prescricoes)
      .values({
        pacienteId: params.pacienteId,
        consultaId: params.consultaId ?? null,
        dataPrescricao: params.dataPrescricao,
        observacoes: params.observacoes ?? null,
        arquivoPdfUrl: params.arquivoPdfUrl ?? null,
      });
    
    const prescricaoId = Number(result[0].insertId);
    const [nova] = await tx.select().from(prescricoes).where(eq(prescricoes.id, prescricaoId));

    const itensValues = params.itens.map((item, index) => ({
      prescricaoId: nova.id,
      medicamentoId: item.medicamentoId ?? null,
      medicamentoTextoLivre: item.medicamentoTextoLivre ?? null,
      dosagem: item.dosagem,
      frequencia: item.frequencia,
      duracao: item.duracao,
      orientacoes: item.orientacoes ?? null,
      ordem: index,
    }));

    if (itensValues.length > 0) {
      await tx.insert(itensPrescricao).values(itensValues);
    }

    return nova;
  });
}

export async function atualizarUrlPdfPrescricao(
  prescricaoId: number,
  arquivoPdfUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(prescricoes)
    .set({ arquivoPdfUrl })
    .where(eq(prescricoes.id, prescricaoId));
}

export async function listarPrescricoesPorPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(prescricoes)
    .where(eq(prescricoes.pacienteId, pacienteId))
    .orderBy(desc(prescricoes.dataPrescricao));

  // carregar itens para cada prescrição
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const itens = await db
    .select()
    .from(itensPrescricao)
    .where(inArray(itensPrescricao.prescricaoId, ids));

  const itensByPrescricao = new Map<number, typeof itensPrescricao.$inferSelect[]>();
  for (const item of itens) {
    const list = itensByPrescricao.get(item.prescricaoId) ?? [];
    list.push(item);
    itensByPrescricao.set(item.prescricaoId, list);
  }

  return rows.map((p) => ({
    ...p,
    itens: itensByPrescricao.get(p.id) ?? [],
  }));
}

export async function obterPrescricaoCompleta(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [prescricao] = await db
    .select()
    .from(prescricoes)
    .where(eq(prescricoes.id, id));

  if (!prescricao) return null;

  const itens = await db
    .select()
    .from(itensPrescricao)
    .where(eq(itensPrescricao.prescricaoId, id))
    .orderBy(itensPrescricao.ordem);

  const [paciente] = await db
    .select()
    .from(pacientes)
    .where(eq(pacientes.id, prescricao.pacienteId));

  return { prescricao, itens, paciente };
}

export async function buscarMedicamentosPorTermo(termo: string) {
  const db = await getDb();
  const likeTerm = `%${termo}%`;
  if (!db) return [];
  return await db
    .select()
    .from(medicamentos)
    .where(
      and(
        eq(medicamentos.ativo, true),
        or(
          sql`${medicamentos.nome} LIKE ${likeTerm}`,
          sql`${medicamentos.principioAtivo} LIKE ${likeTerm}`
        )
      )
    )
    .limit(10);
}

export async function listarMedicamentosAtivos() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(medicamentos)
    .where(eq(medicamentos.ativo, true))
    .orderBy(medicamentos.nome);
}
