import { sql } from 'drizzle-orm';

interface LogSuccessParams {
  userId: number;
  patientId?: number;
  serviceType: string;
  model: string;
  duration: number;
  tokensUsed: number;
}

interface LogErrorParams {
  userId: number;
  patientId?: number;
  serviceType: string;
  error: Error;
  duration: number;
}

export class AIAuditLogger {
  async logSuccess(params: LogSuccessParams): Promise<void> {
    const db = await getDb();
    if (!db) return;
    
    try {
      await db.execute(sql`
        INSERT INTO ai_audit_logs (
          userId, patientId, serviceType, model, provider,
          success, duration, tokensUsed, createdAt
        ) VALUES (
          ${params.userId},
          ${params.patientId || null},
          ${params.serviceType},
          ${params.model},
          ${'gemini'},
          ${true},
          ${params.duration},
          ${params.tokensUsed},
          NOW()
        )
      `);
    } catch (error) {
      console.error('[AIAuditLogger] Failed to log success:', error);
    }
  }
  
  async logError(params: LogErrorParams): Promise<void> {
    const db = await getDb();
    if (!db) return;