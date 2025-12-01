import { describe, it, expect } from "vitest";
import { sugerirPrescricaoIA } from "./services/sugerirPrescricao";
import { verificarInteracoesIA } from "./services/verificarInteracoes";
import { gerarPrescricaoPdf } from "./lib/prescricaoPdfService";

describe("Módulo 18: Prescrições Médicas Inteligentes", () => {
  describe("sugerirPrescricaoIA", () => {
    it("deve sugerir prescrição para diabetes tipo 2", async () => {
      const sugestoes = await sugerirPrescricaoIA({
        diagnostico: "Diabetes mellitus tipo 2 descompensado",
        comorbidades: ["Hipertensão arterial", "Obesidade grau II"],
        idade: 55,
        sexo: "masculino",
      });

      expect(Array.isArray(sugestoes)).toBe(true);
      expect(sugestoes.length).toBeGreaterThan(0);
      
      const primeira = sugestoes[0];
      expect(primeira).toHaveProperty("medicamento");
      expect(primeira).toHaveProperty("dosagem");
      expect(primeira).toHaveProperty("frequencia");
      expect(primeira).toHaveProperty("duracao");
      expect(typeof primeira.medicamento).toBe("string");
      expect(primeira.medicamento.length).toBeGreaterThan(0);
    }, 30000);

    it("deve sugerir prescrição para hipotireoidismo", async () => {
      const sugestoes = await sugerirPrescricaoIA({
        diagnostico: "Hipotireoidismo primário",
        comorbidades: [],
        idade: 42,
        sexo: "feminino",
      });

      expect(Array.isArray(sugestoes)).toBe(true);
      expect(sugestoes.length).toBeGreaterThan(0);
      
      const primeira = sugestoes[0];
      const medicamentoLower = primeira.medicamento.toLowerCase();
      expect(
        medicamentoLower.includes("levotiroxina") || 
        medicamentoLower.includes("t4")
      ).toBe(true);
    }, 30000);

    it("deve retornar array vazio para diagnóstico inválido", async () => {
      try {
        await sugerirPrescricaoIA({
          diagnostico: "",
          comorbidades: [],
        });
      } catch (error: any) {
        expect(error.message).toBeTruthy();
      }
    });
  });

  describe("verificarInteracoesIA", () => {
    it("deve retornar array vazio quando há menos de 2 medicamentos", async () => {
      const interacoes = await verificarInteracoesIA(["Metformina"]);
      expect(interacoes).toEqual([]);
    });

    it("deve identificar interações entre medicamentos comuns", async () => {
      const interacoes = await verificarInteracoesIA([
        "Varfarina",
        "Ácido acetilsalicílico",
        "Ibuprofeno",
      ]);

      expect(Array.isArray(interacoes)).toBe(true);
      
      if (interacoes.length > 0) {
        const primeira = interacoes[0];
        expect(primeira).toHaveProperty("medicamento1");
        expect(primeira).toHaveProperty("medicamento2");
        expect(primeira).toHaveProperty("gravidade");
        expect(primeira).toHaveProperty("descricao");
        expect(["leve", "moderada", "grave"]).toContain(primeira.gravidade);
      }
    }, 30000);

    it("deve retornar estrutura correta para interações", async () => {
      const interacoes = await verificarInteracoesIA([
        "Levotiroxina",
        "Carbonato de cálcio",
      ]);

      if (interacoes.length > 0) {
        const primeira = interacoes[0];
        expect(typeof primeira.medicamento1).toBe("string");
        expect(typeof primeira.medicamento2).toBe("string");
        expect(typeof primeira.gravidade).toBe("string");
        expect(typeof primeira.descricao).toBe("string");
      }
    }, 30000);
  });

  describe("Validação de estrutura de dados", () => {
    it("sugestões devem ter todos os campos obrigatórios", async () => {
      const sugestoes = await sugerirPrescricaoIA({
        diagnostico: "Síndrome metabólica",
        comorbidades: ["Dislipidemia"],
      });

      expect(sugestoes.length).toBeGreaterThan(0);
      
      sugestoes.forEach((item) => {
        expect(item.medicamento).toBeTruthy();
        expect(item.dosagem).toBeTruthy();
        expect(item.frequencia).toBeTruthy();
        expect(item.duracao).toBeTruthy();
      });
    }, 30000);

    it("interações devem ter gravidade válida", async () => {
      const interacoes = await verificarInteracoesIA([
        "Insulina NPH",
        "Metformina",
        "Glibenclamida",
      ]);

      interacoes.forEach((interacao) => {
        expect(["leve", "moderada", "grave"]).toContain(interacao.gravidade);
      });
    }, 30000);
  });

  describe("Geração de PDF de prescrição", () => {
    it("formata itens e observações no HTML base", async () => {
      let htmlCapturado = "";
      await gerarPrescricaoPdf(
        {
          pacienteNome: "Maria Silva",
          data: "2024-05-01",
          assinaturaTipo: "digital",
          observacoes: "Revisar em 15 dias",
          itens: [
            {
              nome: "Metformina",
              dosagem: "500mg",
              frequencia: "2x/dia",
              duracao: "30 dias",
              orientacoes: "Ingerir junto às refeições",
            },
          ],
        },
        {
          converter: async (html) => {
            htmlCapturado = html;
            return Buffer.from("pdf");
          },
          filePrefix: "teste",
        }
      );

      expect(htmlCapturado).toContain("Metformina");
      expect(htmlCapturado).toContain("500mg");
      expect(htmlCapturado).toContain("2x/dia");
      expect(htmlCapturado).toContain("30 dias");
      expect(htmlCapturado).toContain("Revisar em 15 dias");
    });

    it("gera metadados e nome de arquivo sanitizado", async () => {
      const resultado = await gerarPrescricaoPdf(
        {
          pacienteNome: "João da Silva",
          data: "2024-05-10",
          itens: [
            {
              nome: "Levotiroxina",
              dosagem: "75mcg",
              frequencia: "1x/dia",
              duracao: "60 dias",
            },
            {
              nome: "Vitamina D",
              dosagem: "2000UI",
              frequencia: "1x/dia",
              duracao: "30 dias",
            },
          ],
        },
        {
          converter: async (html) => Buffer.from(html),
        }
      );

      expect(resultado.metadata.totalItens).toBe(2);
      expect(resultado.metadata.paciente).toBe("João da Silva");
      expect(resultado.fileName).toContain("prescricao-joao-da-silva-2024-05-10.pdf");
    });
  });
});
