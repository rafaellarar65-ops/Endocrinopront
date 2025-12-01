import { describe, it, expect } from 'vitest';
import { laudoSchema } from './laudoSchema';

const baseLaudo = {
  paciente: { id: 1, nome: 'João da Silva', documento: '123.456.789-00' },
  dataEmissao: '2024-05-10',
  achados: [
    {
      titulo: 'Imagem de abdome',
      descricao: 'Fígado de dimensões aumentadas e ecotextura heterogênea.',
    },
  ],
  conclusao: 'Achados compatíveis com esteatose hepática grau II.',
  carimbo: {
    profissional: 'Dra. Ana Souza',
    registro: 'CRM 12345/DF',
    assinaturaDigital: 'Assinado digitalmente',
  },
};

describe('laudoSchema', () => {
  it('valida laudos completos com achados, conclusão e carimbo', () => {
    const parsed = laudoSchema.parse(baseLaudo);
    expect(parsed).toMatchObject({
      paciente: expect.objectContaining({ nome: 'João da Silva' }),
      conclusao: expect.stringContaining('esteatose hepática'),
    });
  });

  it('rejeita laudos sem achados clínicos', () => {
    const result = laudoSchema.safeParse({ ...baseLaudo, achados: [] });
    expect(result.success).toBe(false);
  });

  it('rejeita laudos sem conclusão ou assinatura', () => {
    const missingConclusion = laudoSchema.safeParse({ ...baseLaudo, conclusao: '' });
    const missingSignature = laudoSchema.safeParse({
      ...baseLaudo,
      carimbo: { profissional: '', registro: '', assinaturaDigital: '' },
    });

    expect(missingConclusion.success).toBe(false);
    expect(missingSignature.success).toBe(false);
  });
});
