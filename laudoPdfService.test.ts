import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLaudoPDF, renderLaudoHTML } from './lib/laudoPdfService';

vi.mock(new URL('./svgProcessor.ts', import.meta.url).pathname, () => ({
  convertSVGtoPDF: vi.fn(async () => Buffer.from('pdf')),
}));

vi.mock(new URL('./storage.ts', import.meta.url).pathname, () => ({
  storagePut: vi.fn(async (key: string) => ({ url: `https://mock.storage/${key}` })),
}));

const baseLaudo = {
  paciente: { id: 99, nome: 'Paciente Teste' },
  dataEmissao: '2024-05-11',
  achados: [
    { titulo: 'Lesão cutânea', descricao: 'Placa eritematosa em região posterior.' },
  ],
  conclusao: 'Sugere-se investigação adicional com biópsia.',
  carimbo: {
    profissional: 'Dr. Carlos',
    registro: 'CRM 5555/DF',
    assinaturaDigital: 'Assinado eletronicamente',
  },
};

describe('laudoPdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza HTML com seções de achados, conclusão e carimbo', () => {
    const html = renderLaudoHTML(baseLaudo);

    expect(html).toContain('Laudo Clínico');
    expect(html).toContain('Lesão cutânea');
    expect(html).toContain('Sugere-se investigação adicional');
    expect(html).toContain('Assinado eletronicamente');
  });

  it('gera PDF e publica no storage mantendo interface compatível', async () => {
    const result = await generateLaudoPDF(baseLaudo);
    const { convertSVGtoPDF } = await import('./svgProcessor');
    const { storagePut } = await import('./storage');

    expect(result.pdfUrl).toContain('https://mock.storage/documentos/99/laudo-');
    expect(result.pdfPath).toContain('documentos/99/laudo-');
    expect(result.html).toContain('Laudo Clínico');
    expect(convertSVGtoPDF).toHaveBeenCalledTimes(1);
    expect(storagePut).toHaveBeenCalledTimes(1);
    expect(storagePut).toHaveBeenCalledWith(
      expect.stringContaining('documentos/99/laudo-'),
      expect.any(Buffer),
      'application/pdf'
    );
  });
});
