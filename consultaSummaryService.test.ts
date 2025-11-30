import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConsultaSummary, ConsultaData } from './consultaSummaryService';

// Mock do invokeLLM
vi.mock('../../_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

describe('ConsultaSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar resumo estruturado com todos os campos', async () => {
    const { invokeLLM } = await import('../../_core/llm');
    
    // Mock da resposta da IA
    const mockSummary = {
      principaisQueixas: ['Ganho de peso progressivo', 'Cansaço excessivo'],
      achadosRelevantes: ['IMC 32.5', 'PA 140/90 mmHg', 'Tireoide palpável'],
      hipotesesDiagnosticas: ['Hipotireoidismo', 'Síndrome metabólica'],
      condutasPropostas: ['Solicitar TSH, T4 livre', 'Iniciar dieta hipocalórica'],
      observacoesImportantes: 'Paciente relata histórico familiar de doenças tireoidianas',
      resumoNarrativo: 'Paciente de 45 anos com queixa de ganho de peso progressivo e cansaço. Ao exame físico, IMC 32.5 e tireoide palpável. Hipótese de hipotireoidismo.',
    };

    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockSummary),
            role: 'assistant',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      created: Date.now(),
      id: 'test-id',
      model: 'gpt-4',
      object: 'chat.completion',
    });

    const consultaData: ConsultaData = {
      anamnese: {
        queixaPrincipal: 'Ganho de peso e cansaço',
        hda: 'Paciente relata ganho de peso progressivo nos últimos 6 meses',
        historicoPatologico: 'Nega comorbidades',
        medicamentosEmUso: 'Nenhum',
        alergias: 'Nega',
        historicoFamiliar: 'Mãe com hipotireoidismo',
        habitosVida: 'Sedentária',
      },
      exameFisico: {
        peso: '85',
        altura: '160',
        imc: '32.5',
        pressaoArterial: '140/90',
        frequenciaCardiaca: '72',
        temperatura: '36.5',
        exameGeral: 'BEG, corada, hidratada',
        exameEspecifico: 'Tireoide palpável, sem nódulos',
      },
    };

    const resumo = await generateConsultaSummary(consultaData);

    expect(resumo).toBeDefined();
    expect(resumo.principaisQueixas).toHaveLength(2);
    expect(resumo.achadosRelevantes).toHaveLength(3);
    expect(resumo.hipotesesDiagnosticas).toHaveLength(2);
    expect(resumo.condutasPropostas).toHaveLength(2);
    expect(resumo.observacoesImportantes).toBeTruthy();
    expect(resumo.resumoNarrativo).toBeTruthy();
  });

  it('deve construir prompt com dados da anamnese', async () => {
    const { invokeLLM } = await import('../../_core/llm');
    
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              principaisQueixas: [],
              achadosRelevantes: [],
              hipotesesDiagnosticas: [],
              condutasPropostas: [],
              observacoesImportantes: '',
              resumoNarrativo: '',
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      created: Date.now(),
      id: 'test-id',
      model: 'gpt-4',
      object: 'chat.completion',
    });

    const consultaData: ConsultaData = {
      anamnese: {
        queixaPrincipal: 'Dor de cabeça',
        hda: 'Dor há 3 dias',
      },
    };

    await generateConsultaSummary(consultaData);

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Queixa Principal: Dor de cabeça'),
          }),
        ]),
      })
    );
  });

  it('deve construir prompt com dados do exame físico', async () => {
    const { invokeLLM } = await import('../../_core/llm');
    
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              principaisQueixas: [],
              achadosRelevantes: [],
              hipotesesDiagnosticas: [],
              condutasPropostas: [],
              observacoesImportantes: '',
              resumoNarrativo: '',
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      created: Date.now(),
      id: 'test-id',
      model: 'gpt-4',
      object: 'chat.completion',
    });

    const consultaData: ConsultaData = {
      exameFisico: {
        peso: '70',
        altura: '170',
        imc: '24.2',
      },
    };

    await generateConsultaSummary(consultaData);

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Peso: 70kg'),
          }),
        ]),
      })
    );
  });

  it('deve lançar erro quando a IA retorna resposta vazia', async () => {
    const { invokeLLM } = await import('../../_core/llm');
    
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [],
      created: Date.now(),
      id: 'test-id',
      model: 'gpt-4',
      object: 'chat.completion',
    });

    const consultaData: ConsultaData = {
      anamnese: {
        queixaPrincipal: 'Teste',
      },
    };

    await expect(generateConsultaSummary(consultaData)).rejects.toThrow('Resposta vazia da IA');
  });

  it('deve usar response_format com JSON schema', async () => {
    const { invokeLLM } = await import('../../_core/llm');
    
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              principaisQueixas: [],
              achadosRelevantes: [],
              hipotesesDiagnosticas: [],
              condutasPropostas: [],
              observacoesImportantes: '',
              resumoNarrativo: '',
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      created: Date.now(),
      id: 'test-id',
      model: 'gpt-4',
      object: 'chat.completion',
    });

    const consultaData: ConsultaData = {
      anamnese: {
        queixaPrincipal: 'Teste',
      },
    };

    await generateConsultaSummary(consultaData);

    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({
          type: 'json_schema',
          json_schema: expect.objectContaining({
            name: 'consulta_summary',
            strict: true,
          }),
        }),
      })
    );
  });
});
