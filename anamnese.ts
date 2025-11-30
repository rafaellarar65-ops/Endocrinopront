import { transcribeAudio } from '../../_core/voiceTranscription';
import { invokeLLM } from '../../_core/llm';

export class AnamneseService extends AIService {
  name = 'anamnese';
  version = '1.0.0';
  
  validate(input: AIServiceInput): ValidationResult {
    const errors: string[] = [];
    
    if (!input.data.audioUrl) {
      errors.push('audioUrl is required');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  getMetadata(): ServiceMetadata {
    return {
      name: this.name,
      version: this.version,
      description: 'Transcreve áudio e estrutura anamnese endocrinológica',
    };
  }
  
  async execute(input: AIServiceInput): Promise<AIServiceOutput> {
    const startTime = Date.now();
    
    try {
      // Passo 1: Transcrição com Whisper
      const transcription = await transcribeAudio({
        audioUrl: input.data.audioUrl,
        language: 'pt',
      });
      
      // Verificar se a transcrição foi bem-sucedida
      if (!('text' in transcription)) {
        throw new Error('Transcription failed');
      }
      
      // Passo 2: Estruturação com Gemini
      const prompt = this.buildPrompt(transcription.text, input.data.patientContext);
      
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'Você é um médico endocrinologista experiente.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'anamnese_estruturada',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                queixaPrincipal: { type: 'string' },
                hda: { type: 'string' },
                historicoPatologico: { type: 'string' },
                medicamentosEmUso: { type: 'string' },
                alergias: { type: 'string' },
                historicoFamiliar: { type: 'string' },
                habitosVida: { type: 'string' },
              },
              required: ['queixaPrincipal', 'hda', 'historicoPatologico', 'medicamentosEmUso', 'alergias', 'historicoFamiliar', 'habitosVida'],
              additionalProperties: false,
            },
          },
        },
      });
      
      const messageContent = response.choices[0]?.message?.content;
      const contentText = typeof messageContent === 'string' ? messageContent : '';
      const anamneseData = JSON.parse(contentText || '{}');
      
      return {