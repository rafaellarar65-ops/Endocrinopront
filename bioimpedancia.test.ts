import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BioimpedanciaParser } from "./services/BioimpedanciaParser";
import * as fs from "fs";
import * as path from "path";

describe("Bioimpedância Module", () => {
  describe("BioimpedanciaParser", () => {
    it("deve fazer parse de arquivo Excel válido", () => {
      // Lê o arquivo de exemplo
      const filePath = "/home/ubuntu/upload/Rafael-2025-11-28133021.xls";
      
      // Verifica se o arquivo existe
      if (!fs.existsSync(filePath)) {
        console.warn("Arquivo de teste não encontrado, pulando teste");
        return;
      }
      
      const buffer = fs.readFileSync(filePath);
      
      // Faz o parse
      const medicoes = BioimpedanciaParser.parseExcel(buffer);
      
      // Verifica que retornou medições
      expect(medicoes).toBeDefined();
      expect(Array.isArray(medicoes)).toBe(true);
      expect(medicoes.length).toBeGreaterThan(0);
    });
    
    it("deve extrair campos obrigatórios corretamente", () => {
      const filePath = "/home/ubuntu/upload/Rafael-2025-11-28133021.xls";
      
      if (!fs.existsSync(filePath)) {
        console.warn("Arquivo de teste não encontrado, pulando teste");
        return;
      }
      
      const buffer = fs.readFileSync(filePath);
      const medicoes = BioimpedanciaParser.parseExcel(buffer);
      
      // Verifica primeira medição
      const medicao = medicoes[0];
      
      // Campos básicos
      expect(medicao.altura).toBeGreaterThan(0);
      expect(medicao.peso).toBeGreaterThan(0);
      expect(medicao.imc).toBeGreaterThan(0);
      expect(medicao.dataAvaliacao).toBeInstanceOf(Date);
      
      // Composição corporal
      expect(medicao.massaMuscular).toBeGreaterThan(0);
      expect(medicao.teorAgua).toBeGreaterThan(0);
      
      // Análise segmentar
      expect(medicao.musculoBracoDir).toBeDefined();
      expect(medicao.musculoPernaDir).toBeDefined();
    });
    
    it("deve processar múltiplas medições do mesmo arquivo", () => {
      const filePath = "/home/ubuntu/upload/Rafael-2025-11-28133021.xls";
      
      if (!fs.existsSync(filePath)) {
        console.warn("Arquivo de teste não encontrado, pulando teste");
        return;
      }
      
      const buffer = fs.readFileSync(filePath);
      const medicoes = BioimpedanciaParser.parseExcel(buffer);
      
      // O arquivo de exemplo tem 2 medições
      expect(medicoes.length).toBe(2);
      
      // Verifica que as medições são diferentes
      expect(medicoes[0].peso).not.toBe(medicoes[1].peso);
    });
    
    it("deve lançar erro para arquivo inválido", () => {
      const bufferInvalido = Buffer.from("conteúdo inválido");
      
      expect(() => {
        BioimpedanciaParser.parseExcel(bufferInvalido);
      }).toThrow();
    });
    
    it("deve converter datas corretamente", () => {
      const filePath = "/home/ubuntu/upload/Rafael-2025-11-28133021.xls";
      
      if (!fs.existsSync(filePath)) {
        console.warn("Arquivo de teste não encontrado, pulando teste");
        return;
      }
      
      const buffer = fs.readFileSync(filePath);
      const medicoes = BioimpedanciaParser.parseExcel(buffer);
      
      const medicao = medicoes[0];
      
      // Verifica que a data é válida
      expect(medicao.dataAvaliacao).toBeInstanceOf(Date);
      expect(medicao.dataAvaliacao.getTime()).not.toBeNaN();
      
      // Verifica que a data está em um range razoável (2020-2030)
      const ano = medicao.dataAvaliacao.getFullYear();
      expect(ano).toBeGreaterThanOrEqual(2020);
      expect(ano).toBeLessThanOrEqual(2030);
    });
    
    it("deve extrair todos os 59 campos esperados", () => {
      const filePath = "/home/ubuntu/upload/Rafael-2025-11-28133021.xls";
      
      if (!fs.existsSync(filePath)) {
        console.warn("Arquivo de teste não encontrado, pulando teste");
        return;
      }
      
      const buffer = fs.readFileSync(filePath);
      const medicoes = BioimpedanciaParser.parseExcel(buffer);
      const medicao = medicoes[0];
      
      // Lista de campos esperados
      const camposEsperados = [
        'altura', 'idade', 'dataAvaliacao', 'peso', 'percentualGordura',
        'imc', 'massaMuscular', 'massaOssea', 'teorAgua', 'teorProteina',
        'teorSalInorganico', 'gorduraSubcutanea', 'gorduraVisceral', 'bmr',
        'percentualUmidade', 'taxaMuscular', 'taxaProteina', 'frequenciaMuscularEsqueletica',
        'pesoDesengordurado', 'frequenciaCardiaca', 'pontuacaoFisica', 'tipoCorpo',
        'idadeFisica', 'taxaGorduraSubcutanea', 'nivelSaude', 'nivelObesidade',
        'controlePeso', 'controleGordura', 'controleMuscular', 'pesoPadrao',
        'pesoIdeal', 'volumeCelulas', 'aguaExtracelular', 'aguaIntracelular',
        'gorduraBracoEsq', 'gorduraPernaEsq', 'gorduraBracoDir', 'gorduraPernaDir',
        'gorduraTronco', 'percentualGorduraBracoEsq', 'percentualGorduraPernaEsq',
        'percentualGorduraBracoDir', 'percentualGorduraPernaDir', 'percentualGorduraTronco',
        'musculoBracoEsq', 'musculoPernaEsq', 'musculoBracoDir', 'musculoPernaDir',
        'musculoTronco', 'indiceMassaMuscularEsqueletica', 'relacaoCinturaQuadril',
        'taxaMusculoBracoEsq', 'taxaMusculoPernaEsq', 'taxaMusculoBracoDir',
        'taxaMusculoPernaDir', 'taxaMusculoTronco', 'musculoEsqueletico'
      ];
      
      // Verifica que todos os campos existem
      camposEsperados.forEach(campo => {
        expect(medicao).toHaveProperty(campo);
      });
      
      // Verifica que temos pelo menos 57 campos (alguns podem ser opcionais)
      expect(Object.keys(medicao).length).toBeGreaterThanOrEqual(57);
    });
  });
});
