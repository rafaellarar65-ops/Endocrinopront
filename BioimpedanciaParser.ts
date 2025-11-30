import XLSX from 'xlsx';

export interface BioimpedanciaData {
  altura: number;
  idade: number;
  dataAvaliacao: Date;
  peso: number;
  percentualGordura: number;
  imc: number;
  massaMuscular: number;
  massaOssea: number;
  teorAgua: number;
  teorProteina: number;
  teorSalInorganico: number;
  gorduraSubcutanea: number;
  gorduraVisceral: number;
  bmr: number;
  percentualUmidade: number;
  taxaMuscular: number;
  taxaProteina: number;
  frequenciaMuscularEsqueletica: number;
  pesoDesengordurado: number;
  frequenciaCardiaca: number;
  pontuacaoFisica: number;
  tipoCorpo: number;
  idadeFisica: number;
  taxaGorduraSubcutanea: number;
  nivelSaude: number;
  nivelObesidade: number;
  controlePeso: number;
  controleGordura: number;
  controleMuscular: number;
  pesoPadrao: number;
  pesoIdeal: number;
  volumeCelulas: number;
  aguaExtracelular: number;
  aguaIntracelular: number;
  
  // Análise Segmentar
  gorduraBracoEsq: number;
  gorduraPernaEsq: number;
  gorduraBracoDir: number;
  gorduraPernaDir: number;
  gorduraTronco: number;
  percentualGorduraBracoEsq: number;
  percentualGorduraPernaEsq: number;
  percentualGorduraBracoDir: number;
  percentualGorduraPernaDir: number;
  percentualGorduraTronco: number;
  musculoBracoEsq: number;
  musculoPernaEsq: number;
  musculoBracoDir: number;
  musculoPernaDir: number;
  musculoTronco: number;
  indiceMassaMuscularEsqueletica: number;
  relacaoCinturaQuadril: number;
  taxaMusculoBracoEsq: number;
  taxaMusculoPernaEsq: number;
  taxaMusculoBracoDir: number;
  taxaMusculoPernaDir: number;
  taxaMusculoTronco: number;
  musculoEsqueletico: number;
}

/**
 * Parser para arquivos Excel de bioimpedância
 * Suporta o formato do equipamento XPRO 850
 */
export class BioimpedanciaParser {
  /**
   * Faz o parse de um arquivo Excel de bioimpedância
   * @param buffer Buffer do arquivo Excel
   * @returns Array de dados de bioimpedância (pode ter múltiplas medições)
   */
  static parseExcel(buffer: Buffer): BioimpedanciaData[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Pega a primeira planilha (geralmente "Dados corporais")
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Converte para array de arrays
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (data.length < 2) {
        throw new Error('Arquivo Excel vazio ou inválido');
      }
      
      // Primeira linha contém os cabeçalhos
      const headers = data[0];
      
      // Demais linhas contêm os dados (cada linha é uma medição)
      const medicoes: BioimpedanciaData[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const medicao = this.parseRow(headers, row);
        medicoes.push(medicao);
      }
      
      return medicoes;
    } catch (error) {
      console.error('Erro ao fazer parse do Excel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao processar arquivo de bioimpedância: ${errorMessage}`);
    }
  }
  
  /**
   * Faz o parse de uma linha de dados
   */
  private static parseRow(headers: string[], row: any[]): BioimpedanciaData {
    const getValue = (fieldName: string): any => {
      const index = headers.findIndex(h => h && h.toLowerCase().includes(fieldName.toLowerCase()));
      if (index === -1) return null;
      return row[index];
    };
    
    const getNumber = (fieldName: string): number => {
      const value = getValue(fieldName);
      if (value === null || value === undefined || value === '') return 0;
      const num = parseFloat(String(value).replace(',', '.'));
      return isNaN(num) ? 0 : num;
    };
    
    const getDate = (fieldName: string): Date => {
      const value = getValue(fieldName);
      if (!value) return new Date();
      
      // Se for string no formato "YYYY-MM-DD HH:mm:ss"
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      
      // Se for número (Excel serial date)
      if (typeof value === 'number') {
        // Excel usa 1900-01-01 como base (serial 1)
        // JavaScript usa 1970-01-01
        const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date;
      }
      
      return new Date();
    };
    
    return {
      altura: getNumber('altura'),
      idade: getNumber('idade'),
      dataAvaliacao: getDate('tempo de pesagem'),
      peso: getNumber('peso corporal'),
      percentualGordura: getNumber('percentagem de gordura corporal'),
      imc: getNumber('imc'),
      massaMuscular: getNumber('massa muscular'),
      massaOssea: getNumber('massa óssea'),
      teorAgua: getNumber('teor de água'),
      teorProteina: getNumber('teor proteico'),
      teorSalInorganico: getNumber('teor de sal inorgânico'),
      gorduraSubcutanea: getNumber('volume de gordura subcutânea'),
      gorduraVisceral: getNumber('nível de gordura visceral'),
      bmr: getNumber('bmr'),
      percentualUmidade: getNumber('teor de humidade corporal'),
      taxaMuscular: getNumber('taxa muscular'),
      taxaProteina: getNumber('taxa interna de proteínas'),
      frequenciaMuscularEsqueletica: getNumber('frequência muscular esquelética'),
      pesoDesengordurado: getNumber('peso corporal desengordurado'),
      frequenciaCardiaca: getNumber('frequência cardíaca'),
      pontuacaoFisica: getNumber('pontuação física'),
      tipoCorpo: getNumber('tipo de corpo'),
      idadeFisica: getNumber('idade física'),
      taxaGorduraSubcutanea: getNumber('taxa de gordura subcutânea'),
      nivelSaude: getNumber('nível de saúde'),
      nivelObesidade: getNumber('nível de obesidade'),
      controlePeso: getNumber('quantidade de controlo do peso'),
      controleGordura: getNumber('quantidade de controlo da gordura'),
      controleMuscular: getNumber('volume de controlo muscular'),
      pesoPadrao: getNumber('peso corporal padrão'),
      pesoIdeal: getNumber('peso ideal'),
      volumeCelulas: getNumber('volume de células corporais'),
      aguaExtracelular: getNumber('volume de água extracelular'),
      aguaIntracelular: getNumber('volume de água intracelular'),
      
      // Análise Segmentar - Gordura
      gorduraBracoEsq: getNumber('gordura da mão esquerda'),
      gorduraPernaEsq: getNumber('gordura do pé esquerdo'),
      gorduraBracoDir: getNumber('gordura da mão direita'),
      gorduraPernaDir: getNumber('gordura do pé direito'),
      gorduraTronco: getNumber('massa de gordura corporal'),
      percentualGorduraBracoEsq: getNumber('percentagem de gordura da mão esquerda'),
      percentualGorduraPernaEsq: getNumber('percentagem de gordura do pé esquerdo'),
      percentualGorduraBracoDir: getNumber('percentagem de gordura da mão direita'),
      percentualGorduraPernaDir: getNumber('percentagem de gordura do pé direito'),
      percentualGorduraTronco: getNumber('percentagem de gordura corporal'),
      
      // Análise Segmentar - Músculo
      musculoBracoEsq: getNumber('massa muscular da mão esquerda'),
      musculoPernaEsq: getNumber('massa muscular do pé esquerdo'),
      musculoBracoDir: getNumber('massa muscular da mão direita'),
      musculoPernaDir: getNumber('massa muscular do pé direito'),
      musculoTronco: getNumber('massa muscular do tronco'),
      indiceMassaMuscularEsqueletica: getNumber('índice de massa muscular esquelética'),
      relacaoCinturaQuadril: getNumber('relação cintura-quadril'),
      taxaMusculoBracoEsq: getNumber('taxa de músculo da mão esquerda'),
      taxaMusculoPernaEsq: getNumber('taxa de músculo da perna esquerda'),
      taxaMusculoBracoDir: getNumber('taxa de músculo da mão direita'),
      taxaMusculoPernaDir: getNumber('taxa de músculo do pé direito'),
      taxaMusculoTronco: getNumber('taxa muscular do tronco'),
      musculoEsqueletico: getNumber('quantidade muscular esquelética'),
    };
  }
}
