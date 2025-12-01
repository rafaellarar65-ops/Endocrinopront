import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExameResultadosTable } from "./ExameResultadosTable";

const sampleResultados = [
  { id: 1, parametro: "Hemoglobina", valor: "13.5", unidade: "g/dL", referencia: "12-16", status: "normal" },
  { id: 2, parametro: "RDW", valor: "12", unidade: "%", referencia: "11-15", status: "normal" },
];

describe("ExameResultadosTable", () => {
  it("renderiza IDs e parâmetros", () => {
    const html = renderToStaticMarkup(<ExameResultadosTable resultados={sampleResultados} />);

    expect(html).toContain("Hemoglobina");
    expect(html).toContain("RDW");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
  });
});
