export interface EscoreContextoBasico {
  idade?: number;
  sexo?: "masculino" | "feminino" | string;
  peso?: number | null;
  altura?: number | null;
  circunferencia?: number | null;
  pressaoSistolica?: number | null;
  glicemia?: number | null;
  hba1c?: number | null;
  colesterolTotal?: number | null;
  ldl?: number | null;
  hdl?: number | null;
  triglicerideos?: number | null;
  insulina?: number | null;
  creatinina?: number | null;
  tabagismo?: boolean;
  diabetes?: boolean;
}

export interface EscoreResultadoCalculado {
  tipoEscore: string;
  nome: string;
  resultado: any;
  interpretacao: string;
  parametrosUsados: Record<string, any>;
  faltantes?: string[];
}

const arredondar = (valor: number | null | undefined, casas = 2) => {
  if (valor == null || Number.isNaN(valor)) return null;
  return Number(valor.toFixed(casas));
};

const calcularIMC = (peso?: number | null, altura?: number | null) => {
  if (!peso || !altura) return null;
  const metros = altura > 3 ? altura / 100 : altura;
  if (!metros) return null;
  return arredondar(peso / (metros * metros));
};

export function calcularHomaIR(ctx: EscoreContextoBasico): EscoreResultadoCalculado | null {
  if (ctx.glicemia == null || ctx.insulina == null) return null;
  const score = arredondar((ctx.glicemia * ctx.insulina) / 405, 2);
  const interpretacao =
    score == null
      ? "Dados insuficientes"
      : score >= 2.7
        ? "Compatível com resistência insulínica"
        : "Dentro de faixa esperada";
  return {
    tipoEscore: "homa-ir",
    nome: "HOMA-IR",
    resultado: { valor: score },
    interpretacao,
    parametrosUsados: {
      glicemia: ctx.glicemia,
      insulina: ctx.insulina,
    },
  };
}

export function calcularTyG(ctx: EscoreContextoBasico): EscoreResultadoCalculado | null {
  if (ctx.glicemia == null || ctx.triglicerideos == null) return null;
  const idx = arredondar(Math.log((ctx.triglicerideos * ctx.glicemia) / 2));
  const interpretacao = idx && idx >= 8.8 ? "Alto risco cardiometabólico" : "Risco habitual";
  return {
    tipoEscore: "tyg-index",
    nome: "TyG Index",
    resultado: { valor: idx },
    interpretacao,
    parametrosUsados: {
      glicemia: ctx.glicemia,
      triglicerideos: ctx.triglicerideos,
    },
  };
}

export function calcularTFG(ctx: EscoreContextoBasico): EscoreResultadoCalculado | null {
  if (ctx.creatinina == null || ctx.idade == null) return null;
  const k = ctx.sexo === "feminino" ? 0.7 : 0.9;
  const alpha = ctx.sexo === "feminino" ? -0.329 : -0.411;
  const min = Math.min(ctx.creatinina / k, 1);
  const max = Math.max(ctx.creatinina / k, 1);
  const multiplicadorSexo = ctx.sexo === "feminino" ? 1.018 : 1;
  const tfg = 141 * Math.pow(min, alpha) * Math.pow(max, -1.209) * Math.pow(0.993, ctx.idade) * multiplicadorSexo;
  const valor = arredondar(tfg);
  const interpretacao = valor && valor < 60 ? "Sugere DRC (TFG < 60)" : "TFG preservada";
  return {
    tipoEscore: "tfg", // CKD-EPI simplificado
    nome: "TFG (CKD-EPI simplificado)",
    resultado: { valor },
    interpretacao,
    parametrosUsados: {
      creatinina: ctx.creatinina,
      idade: ctx.idade,
      sexo: ctx.sexo,
    },
  };
}

export function calcularFramingham(ctx: EscoreContextoBasico): EscoreResultadoCalculado | null {
  const faltantes: string[] = [];
  if (ctx.idade == null) faltantes.push("idade");
  if (ctx.colesterolTotal == null) faltantes.push("colesterol total");
  if (ctx.hdl == null) faltantes.push("HDL");
  if (ctx.pressaoSistolica == null) faltantes.push("PA sistólica");
  if (faltantes.length > 0) {
    return {
      tipoEscore: "framingham",
      nome: "Framingham (10 anos)",
      resultado: null,
      interpretacao: "Dados insuficientes para cálculo",
      parametrosUsados: ctx,
      faltantes,
    };
  }

  const idade = ctx.idade ?? 0;
  const riscoBase = idade < 50 ? 3 : idade < 60 ? 6 : 10;
  const fatorColesterol = (ctx.colesterolTotal ?? 0) / 50;
  const fatorHDL = ctx.hdl ? (60 - ctx.hdl) / 25 : 0;
  const fatorPA = (ctx.pressaoSistolica ?? 0) > 140 ? 3 : 1;
  const fatorTabaco = ctx.tabagismo ? 2 : 0;
  const fatorDiabetes = ctx.diabetes ? 2 : 0;
  const risco = Math.max(0, riscoBase + fatorColesterol + fatorHDL + fatorPA + fatorTabaco + fatorDiabetes);
  const riscoFinal = Math.min(30, arredondar(risco, 1) ?? risco);
  const interpretacao =
    riscoFinal >= 20
      ? "Alto risco cardiovascular (≥20% em 10 anos)"
      : riscoFinal >= 10
        ? "Risco intermediário"
        : "Risco baixo";

  return {
    tipoEscore: "framingham",
    nome: "Framingham (10 anos)",
    resultado: { riscoPercentual10Anos: riscoFinal },
    interpretacao,
    parametrosUsados: {
      idade: ctx.idade,
      colesterolTotal: ctx.colesterolTotal,
      hdl: ctx.hdl,
      pressaoSistolica: ctx.pressaoSistolica,
      tabagismo: ctx.tabagismo,
      diabetes: ctx.diabetes,
    },
  };
}

export function calcularFindrisc(ctx: EscoreContextoBasico): EscoreResultadoCalculado | null {
  const faltantes: string[] = [];
  if (ctx.idade == null) faltantes.push("idade");
  const imc = calcularIMC(ctx.peso ?? undefined, ctx.altura ?? undefined);
  if (imc == null) faltantes.push("IMC");
  if (faltantes.length > 0) {
    return {
      tipoEscore: "findrisc",
      nome: "FINDRISC",
      resultado: null,
      interpretacao: "Dados insuficientes para cálculo",
      parametrosUsados: { ...ctx, imc },
      faltantes,
    };
  }

  let pontos = 0;
  if (ctx.idade && ctx.idade >= 65) pontos += 4;
  else if (ctx.idade && ctx.idade >= 55) pontos += 3;
  else if (ctx.idade && ctx.idade >= 45) pontos += 2;

  if (imc >= 35) pontos += 3;
  else if (imc >= 30) pontos += 2;
  else if (imc >= 25) pontos += 1;

  if (ctx.circunferencia && ctx.circunferencia >= 102) pontos += 4;
  else if (ctx.circunferencia && ctx.circunferencia >= 94) pontos += 3;

  if (ctx.glicemia && ctx.glicemia >= 110) pontos += 5;
  if (ctx.hba1c && ctx.hba1c >= 5.7) pontos += 2;

  const risco =
    pontos >= 20 ? "Risco muito alto" : pontos >= 15 ? "Risco alto" : pontos >= 12 ? "Risco moderado" : "Risco baixo";

  return {
    tipoEscore: "findrisc",
    nome: "FINDRISC",
    resultado: { pontos, risco },
    interpretacao: `${risco} para DM2 em 10 anos (pontuação ${pontos})`,
    parametrosUsados: { ...ctx, imc },
  };
}

export function montarEscoreContexto(dados: Partial<EscoreContextoBasico>): EscoreContextoBasico {
  return {
    idade: dados.idade,
    sexo: dados.sexo,
    peso: dados.peso ?? null,
    altura: dados.altura ?? null,
    circunferencia: dados.circunferencia ?? null,
    pressaoSistolica: dados.pressaoSistolica ?? null,
    glicemia: dados.glicemia ?? null,
    hba1c: dados.hba1c ?? null,
    colesterolTotal: dados.colesterolTotal ?? null,
    ldl: dados.ldl ?? null,
    hdl: dados.hdl ?? null,
    triglicerideos: dados.triglicerideos ?? null,
    insulina: dados.insulina ?? null,
    creatinina: dados.creatinina ?? null,
    tabagismo: dados.tabagismo,
    diabetes: dados.diabetes,
  };
}

export function calcularEscoresPadrao(ctx: EscoreContextoBasico): EscoreResultadoCalculado[] {
  const calculados: (EscoreResultadoCalculado | null)[] = [
    calcularFindrisc(ctx),
    calcularFramingham(ctx),
    calcularHomaIR(ctx),
    calcularTyG(ctx),
    calcularTFG(ctx),
  ];
  return calculados.filter(Boolean) as EscoreResultadoCalculado[];
}
