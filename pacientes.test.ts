import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `medico${userId}@example.com`,
    name: `Dr. Teste ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Pacientes Module", () => {
  describe("pacientes.create", () => {
    it("should create a new patient with required fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const paciente = await caller.pacientes.create({
        nome: "João da Silva",
        cpf: "123.456.789-00",
        sexo: "masculino",
      });

      expect(paciente).toBeDefined();
      expect(paciente.nome).toBe("João da Silva");
      expect(paciente.cpf).toBe("123.456.789-00");
      expect(paciente.sexo).toBe("masculino");
      expect(paciente.medicoId).toBe(ctx.user.id);
      expect(paciente.ativo).toBe(true);
    });

    it("should create a patient with all optional fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const dataNascimento = new Date("1980-05-15");
      
      const paciente = await caller.pacientes.create({
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        dataNascimento,
        sexo: "feminino",
        contatoWhatsapp: "(11) 98765-4321",
        email: "maria@example.com",
        telefone: "(11) 3456-7890",
        endereco: "Rua Teste, 123",
        observacoes: "Paciente com histórico de diabetes",
      });

      expect(paciente).toBeDefined();
      expect(paciente.nome).toBe("Maria Santos");
      expect(paciente.email).toBe("maria@example.com");
      expect(paciente.contatoWhatsapp).toBe("(11) 98765-4321");
      expect(paciente.observacoes).toBe("Paciente com histórico de diabetes");
    });
  });

  describe("pacientes.list", () => {
    it("should list all patients for the authenticated doctor", async () => {
      const ctx = createAuthContext(2);
      const caller = appRouter.createCaller(ctx);

      // Create some test patients
      await caller.pacientes.create({
        nome: "Paciente 1",
        sexo: "masculino",
      });

      await caller.pacientes.create({
        nome: "Paciente 2",
        sexo: "feminino",
      });

      const pacientes = await caller.pacientes.list();

      expect(pacientes).toBeDefined();
      expect(Array.isArray(pacientes)).toBe(true);
      expect(pacientes.length).toBeGreaterThanOrEqual(2);
      
      // All patients should belong to the same doctor
      pacientes.forEach(p => {
        expect(p.medicoId).toBe(ctx.user.id);
      });
    });

    it("should return empty array if doctor has no patients", async () => {
      const ctx = createAuthContext(999); // New doctor with no patients
      const caller = appRouter.createCaller(ctx);

      const pacientes = await caller.pacientes.list();

      expect(pacientes).toBeDefined();
      expect(Array.isArray(pacientes)).toBe(true);
      expect(pacientes.length).toBe(0);
    });
  });

  describe("pacientes.getById", () => {
    it("should retrieve a patient by ID", async () => {
      const ctx = createAuthContext(3);
      const caller = appRouter.createCaller(ctx);

      const created = await caller.pacientes.create({
        nome: "Carlos Oliveira",
        cpf: "111.222.333-44",
        sexo: "masculino",
      });

      const retrieved = await caller.pacientes.getById({ id: created.id });

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.nome).toBe("Carlos Oliveira");
    });

    it("should return undefined for non-existent patient", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const retrieved = await caller.pacientes.getById({ id: 999999 });

      expect(retrieved).toBeUndefined();
    });
  });

  describe("pacientes.update", () => {
    it("should update patient information", async () => {
      const ctx = createAuthContext(4);
      const caller = appRouter.createCaller(ctx);

      const created = await caller.pacientes.create({
        nome: "Ana Costa",
        sexo: "feminino",
      });

      const updated = await caller.pacientes.update({
        id: created.id,
        email: "ana.costa@example.com",
        contatoWhatsapp: "(11) 91234-5678",
      });

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
      expect(updated?.email).toBe("ana.costa@example.com");
      expect(updated?.contatoWhatsapp).toBe("(11) 91234-5678");
      expect(updated?.nome).toBe("Ana Costa"); // Nome não deve mudar
    });

    it("should deactivate a patient", async () => {
      const ctx = createAuthContext(5);
      const caller = appRouter.createCaller(ctx);

      const created = await caller.pacientes.create({
        nome: "Pedro Alves",
        sexo: "masculino",
      });

      const updated = await caller.pacientes.update({
        id: created.id,
        ativo: false,
      });

      expect(updated).toBeDefined();
      expect(updated?.ativo).toBe(false);
    });
  });

  describe("pacientes.search", () => {
    it("should find patients by name", async () => {
      const ctx = createAuthContext(6);
      const caller = appRouter.createCaller(ctx);

      await caller.pacientes.create({
        nome: "Roberto Mendes",
        sexo: "masculino",
      });

      const results = await caller.pacientes.search({ searchTerm: "Roberto" });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.nome).toContain("Roberto");
    });

    it("should find patients by CPF", async () => {
      const ctx = createAuthContext(7);
      const caller = appRouter.createCaller(ctx);

      await caller.pacientes.create({
        nome: "Fernanda Lima",
        cpf: "555.666.777-88",
        sexo: "feminino",
      });

      const results = await caller.pacientes.search({ searchTerm: "555.666" });

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.cpf).toContain("555.666");
    });

    it("should return empty array for non-matching search", async () => {
      const ctx = createAuthContext(8);
      const caller = appRouter.createCaller(ctx);

      const results = await caller.pacientes.search({ searchTerm: "NonExistentPatient12345" });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
