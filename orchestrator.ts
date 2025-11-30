import { AIService, AIServiceInput, AIServiceOutput, AIError } from './services/base';
import { AnamneseService } from './services/anamnese';
import { AIAuditLogger } from './audit/logger';
import { getAIConfig } from './config/ai-config';

export class AIOrchestrator {
  private services: Map<string, AIService>;
  private logger: AIAuditLogger;
  
  constructor() {
    this.services = new Map();
    this.logger = new AIAuditLogger();
    
    // Registrar serviços
    this.registerService('anamnese', new AnamneseService());
  }
  
  registerService(name: string, service: AIService) {
    this.services.set(name, service);
  }
  
  async execute(
    serviceType: string,
    input: AIServiceInput
  ): Promise<AIServiceOutput> {
    const startTime = Date.now();
    const service = this.services.get(serviceType);
    
    if (!service) {
      throw new Error(`AI service not found: ${serviceType}`);
    }
    
    try {
      // Validar entrada
      const validation = service.validate(input);
      if (!validation.valid) {
        throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
      }
      
      // Executar com retry
      const result = await this.executeWithRetry(service, input);
      
      // Log de sucesso
      await this.logger.logSuccess({
        userId: input.userId,
        patientId: input.patientId,
        serviceType,
        model: result.metadata.model,
        duration: Date.now() - startTime,
        tokensUsed: result.metadata.tokensUsed,
      });
      
      return result;
    } catch (error) {
      // Log de erro
      await this.logger.logError({
        userId: input.userId,
        patientId: input.patientId,
        serviceType,
        error: error as Error,
        duration: Date.now() - startTime,
      });
      
      throw error;
    }
  }
  
  private async executeWithRetry(
    service: AIService,
    input: AIServiceInput,
    maxRetries: number = 3
  ): Promise<AIServiceOutput> {
    let lastError: Error | null = null;
    const config = getAIConfig();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(service, input, config.timeout);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  private async executeWithTimeout(
    service: AIService,
    input: AIServiceInput,
    timeout: number
  ): Promise<AIServiceOutput> {
    return Promise.race([
      service.execute(input),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI service timeout')), timeout)
      ),
    ]);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instância singleton
export const aiOrchestrator = new AIOrchestrator();
