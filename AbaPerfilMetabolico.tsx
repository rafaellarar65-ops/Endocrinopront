import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, Activity, Search, ExternalLink, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface IndiceMetabolicoSugestao {
  id: string;
  nome: string;
  categoria: string;
  valorCalculado: number | null;
  unidade: string | null;
  interpretacao: string;
  motivoRelevancia: string;
  dadosUtilizados: string[];
  guidelineReferencia?: string;
}

interface EscoreRealizado {
  id: number;
  tipoEscore: string;
  dataCalculo: string;
  resultado: any;
  interpretacao?: string | null;
}

interface EscoreSugestaoIA {
  id: string;
  nome: string;
  categoria: string;
  prioridade?: "alta" | "media" | "baixa";
  contextoClinico?: string;
  motivoRelevancia?: string;
}

interface EscoreCatalogoEntry {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  referencia?: string;
}

interface AbaPerfilMetabolicoProps {
  consultaId: number;
  pacienteId: number;
  onSyncIA?: () => void;
  syncingIA?: boolean;
}

export function AbaPerfilMetabolico({
  consultaId,
  pacienteId,
  onSyncIA,
  syncingIA,
}: AbaPerfilMetabolicoProps) {
  const [, setLocation] = useLocation();

  const {
    data: perfil,
    isLoading: loadingExame,
    isError: errorExame,
    refetch: refetchExame,
  } = trpc.consultas.getUltimosExames.useQuery(
    { pacienteId },
    { enabled: !!pacienteId, staleTime: 5 * 60 * 1000 }
  );

  const {
    data: indices,
    isLoading: loadingIndices,
    isError: errorIndices,
    refetch: refetchIndices,
  } = trpc.consultas.sugerirIndicesMetabolicos.useQuery(
    { consultaId },
    { enabled: !!consultaId, staleTime: 5 * 60 * 1000 }
  );

  const {
    data: escores,
    isLoading: loadingEscores,
    isError: errorEscores,
    refetch: refetchEscores,
  } = trpc.escores.getByPaciente.useQuery(
    { pacienteId },
    { enabled: !!pacienteId, staleTime: 5 * 60 * 1000 }
  );

  const {
    data: escoresSugeridos,
    isLoading: loadingEscoresSugeridos,
    isError: errorEscoresSugeridos,
    refetch: refetchEscoresSugeridos,
  } = trpc.exameFisico.sugerirEscores.useQuery(
    { consultaId },
    { enabled: !!consultaId, staleTime: 5 * 60 * 1000 }
  );

  const [buscaEscore, setBuscaEscore] = useState("");
  const { data: catalogoEscores, isFetching: loadingCatalogo } =
    trpc.escores.buscarCatalogo.useQuery(
      { termo: buscaEscore, limit: 12 },
      { keepPreviousData: true }
    );

  const calcularEscores = trpc.escores.calcularAutomatizados.useMutation?.({
    onSuccess: () => {
      refetchEscores();
    },
  });
  const [statusAutomacao, setStatusAutomacao] = useState<string | null>(null);

  const dataLabel = perfil?.dataExame
    ? new Date(perfil.dataExame).toLocaleDateString("pt-BR")
    : null;

  const escoresExecutados = useMemo(() => {
    if (!escores || escores.length === 0) return [];
    return (escores as EscoreRealizado[]).map((esc) => {
      let parsedResultado: any = esc.resultado;
      try {
        parsedResultado =
          typeof esc.resultado === "string"
            ? JSON.parse(esc.resultado)
            : esc.resultado;
      } catch {
        parsedResultado = esc.resultado;
      }

      return {
        ...esc,
        parsedResultado,
      };
    });
  }, [escores]);

  const formatResultadoEscore = (resultado: any) => {
    if (resultado == null) return "—";
    if (typeof resultado === "string") return resultado;
    if (typeof resultado === "number") return resultado.toString();
    try {
      return JSON.stringify(resultado);
    } catch {
      return String(resultado);
    }
  };

  // ESTADOS DE ERRO CARREGAMENTO
  if (loadingExame && !perfil) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando perfil metabólico...
      </div>
    );
  }

  if (errorExame && !perfil) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <p className="text-sm text-red-500">
          Erro ao carregar os exames laboratoriais.
        </p>
        <button
          onClick={() => refetchExame()}
          className="text-xs text-blue-600 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Perfil metabólico e índices sugeridos
          </h2>
          {dataLabel && (
            <p className="text-xs text-gray-500">
              Último exame em{" "}
              <span className="font-medium">{dataLabel}</span>
            </p>
          )}
        </div>
        {onSyncIA && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncIA}
            disabled={!!syncingIA}
            className="inline-flex items-center gap-2"
          >
            {syncingIA ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sincronizando IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Atualizar com IA
              </>
            )}
            </Button>
        )}
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-900">Calcular escores automaticamente</p>
          <p className="text-xs text-blue-800">
            FINDRISC, Framingham, HOMA-IR, TyG e TFG serão calculados a partir dos dados mais recentes da consulta e exames.
          </p>
          {statusAutomacao && (
            <p className="text-[11px] text-blue-700 mt-1">{statusAutomacao}</p>
          )}
        </div>
        <Button
          onClick={async () => {
            setStatusAutomacao("Executando automação de escores...");
            try {
              await calcularEscores?.mutateAsync?.({ pacienteId, consultaId });
              setStatusAutomacao("Escores atualizados e salvos no histórico.");
            } catch (error) {
              setStatusAutomacao("Não foi possível calcular agora. Tente novamente.");
            }
          }}
          disabled={!!calcularEscores?.isLoading || !pacienteId}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {calcularEscores?.isLoading ? "Calculando..." : "Calcular escores padrão"}
        </Button>
      </div>

      {/* BLOCO 1 – EXAMES BÁSICOS */}
      {!perfil ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
          <FlaskConical className="h-8 w-8 text-gray-400" />
          <p className="text-gray-500">
            Nenhum exame laboratorial registrado para este paciente.
          </p>
          <p className="text-xs text-gray-400">
            Os índices metabólicos serão sugeridos a partir dos exames assim que
            você os lançar no sistema.
          </p>
        </div>
      ) : (
        <>
          {/* Glicemia & HbA1c */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Glicemia */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Glicemia</p>
                    <p className="text-2xl font-bold">
                      {perfil.glicemia ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">mg/dL</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HbA1c */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">HbA1c</p>
                    <p className="text-2xl font-bold">
                      {perfil.hba1c ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Perfil lipídico */}
          <div>
            <h3 className="font-semibold text-lg mb-3">
              Perfil lipídico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">
                    Colesterol total
                  </p>
                  <p className="text-xl font-bold">
                    {perfil.colesterolTotal ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">mg/dL</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">LDL</p>
                  <p className="text-xl font-bold">
                    {perfil.ldl ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">mg/dL</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">HDL</p>
                  <p className="text-xl font-bold">
                    {perfil.hdl ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">mg/dL</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">
                    Triglicerídeos
                  </p>
                  <p className="text-xl font-bold">
                    {perfil.triglicerideos ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">mg/dL</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tireoide */}
          <div>
            <h3 className="font-semibold text-lg mb-3">
              Perfil tireoidiano
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">TSH</p>
                  <p className="text-xl font-bold">
                    {perfil.tsh ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">µUI/mL</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">
                    T4 Livre
                  </p>
                  <p className="text-xl font-bold">
                    {perfil.t4Livre ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-500">ng/dL</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* BLOCO 1.5 – ESCORES CLÍNICOS */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg">Escores clínicos do paciente</h3>
            <p className="text-xs text-gray-500">
              Consulte o histórico de escores calculados e execute novos sugeridos pela IA.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/escores")}
          >
            Abrir biblioteca
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </div>

        {/* Escores já realizados */}
        {loadingEscores && !escores && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando escores...
          </div>
        )}

        {errorEscores && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <span>Não foi possível carregar os escores já realizados.</span>
            <Button variant="ghost" size="sm" onClick={() => refetchEscores()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!loadingEscores && !errorEscores && escoresExecutados.length === 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
            Nenhum escore calculado ainda para este paciente.
          </div>
        )}

        {!loadingEscores && escoresExecutados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {escoresExecutados.map((esc) => (
              <Card key={esc.id} className="border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {esc.tipoEscore}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {new Date(esc.dataCalculo).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold">Resultado:</span>
                    <span className="break-words">
                      {formatResultadoEscore((esc as any).parsedResultado)}
                    </span>
                  </div>
                  {esc.interpretacao && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Interpretação: </span>
                      {esc.interpretacao}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Escores sugeridos pela IA */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Escores sugeridos pela IA</h4>
            {loadingEscoresSugeridos && (
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Avaliando quadro...
              </div>
            )}
          </div>

          {errorEscoresSugeridos && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between">
              <span>Erro ao sugerir escores. Tente novamente.</span>
              <Button variant="ghost" size="sm" onClick={() => refetchEscoresSugeridos()}>
                Recarregar
              </Button>
            </div>
          )}

          {!loadingEscoresSugeridos &&
            !errorEscoresSugeridos &&
            escoresSugeridos &&
            (escoresSugeridos as EscoreSugestaoIA[]).length === 0 && (
              <p className="text-[11px] text-gray-500">
                Nenhum escore adicional recomendado com os dados atuais.
              </p>
            )}

          {!loadingEscoresSugeridos &&
            !errorEscoresSugeridos &&
            escoresSugeridos &&
            (escoresSugeridos as EscoreSugestaoIA[]).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(escoresSugeridos as EscoreSugestaoIA[]).map((esc) => (
                  <Card key={esc.id} className="border-gray-200">
                    <CardContent className="p-3 space-y-2 text-xs text-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{esc.nome}</p>
                          <p className="text-[11px] text-gray-500">{esc.categoria}</p>
                        </div>
                        {esc.prioridade && (
                          <Badge variant="outline" className="text-[10px]">
                            {esc.prioridade.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      {esc.motivoRelevancia && (
                        <p className="text-gray-600">{esc.motivoRelevancia}</p>
                      )}
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setLocation(`/escores?tipo=${encodeURIComponent(esc.nome)}`)
                        }
                      >
                        Realizar escore
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>

        {/* Busca em banco de escores */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-semibold">Buscar outros escores</p>
              <p className="text-[11px] text-gray-500">
                Pesquise no banco de escores atualizado via menu principal.
              </p>
            </div>
          </div>
          <Input
            placeholder="Digite nome ou condição (ex.: FRAX, PREVENT, tireoide)"
            value={buscaEscore}
            onChange={(e) => setBuscaEscore(e.target.value)}
          />

          {loadingCatalogo && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando banco...
            </div>
          )}

          {!loadingCatalogo && catalogoEscores && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(catalogoEscores as EscoreCatalogoEntry[]).map((esc) => (
                <Card key={esc.id} className="border-gray-200">
                  <CardContent className="p-3 space-y-1 text-xs text-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{esc.nome}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {esc.categoria}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{esc.descricao}</p>
                    {esc.referencia && (
                      <p className="text-[10px] text-gray-500">Ref.: {esc.referencia}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setLocation(`/escores?tipo=${encodeURIComponent(esc.nome)}`)
                      }
                    >
                      Realizar escore
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 2 – ÍNDICES METABÓLICOS SUGERIDOS PELA IA */}
      <div className="border-t pt-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">
            Índices e relações metabólicas sugeridos pela IA
          </h3>
          {loadingIndices && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analisando quadro clínico e exames...
            </div>
          )}
        </div>

        {errorIndices && (
          <div className="flex flex-col gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>
                Não foi possível sugerir índices metabólicos neste
                momento.
              </span>
            </div>
            <button
              onClick={() => refetchIndices()}
              className="underline underline-offset-2 text-blue-600 text-left"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loadingIndices &&
          !errorIndices &&
          (!indices || indices.length === 0) && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
              <p className="font-semibold mb-1">
                Nenhum índice específico sugerido.
              </p>
              <p>
                A IA não identificou, com os dados atuais, índices
                metabólicos adicionais que alterem de forma relevante a
                estratificação de risco. Reavalie após novos exames ou
                definição diagnóstica.
              </p>
            </div>
          )}

        {!loadingIndices &&
          !errorIndices &&
          indices &&
          (indices as IndiceMetabolicoSugestao[]).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(indices as IndiceMetabolicoSugestao[]).map((ind) => (
                <Card key={ind.id} className="border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {ind.nome}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5"
                      >
                        {ind.categoria}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-gray-700">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">Valor:</span>
                      <span>
                        {ind.valorCalculado != null
                          ? `${ind.valorCalculado}${
                              ind.unidade ? " " + ind.unidade : ""
                            }`
                          : "Não calculado com segurança"}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold">
                        Interpretação
                      </p>
                      <p>{ind.interpretacao}</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        Motivo da relevância neste caso
                      </p>
                      <p>{ind.motivoRelevancia}</p>
                    </div>

                    <div>
                      <p className="font-semibold">
                        Dados utilizados
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {ind.dadosUtilizados.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    {ind.guidelineReferencia && (
                      <p className="text-[10px] text-gray-500 italic">
                        Ref.: {ind.guidelineReferencia}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
