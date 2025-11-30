import * as XLSX from 'xlsx';

const filePath = '/home/ubuntu/upload/Rafael-2025-11-28133021.xls';

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('📊 Análise do arquivo de Bioimpedância\n');
  console.log('Planilhas encontradas:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Planilha: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`Total de linhas: ${data.length}`);
    console.log('\nPrimeiras 30 linhas:');
    data.slice(0, 30).forEach((row, idx) => {
      if (row && row.length > 0) {
        console.log(`Linha ${idx}:`, row);
      }
    });
  });
} catch (error) {
  console.error('Erro ao ler arquivo:', error.message);
}
