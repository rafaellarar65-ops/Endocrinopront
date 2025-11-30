import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, Activity } from "lucide-react";

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

interface AbaPerfilMetabolicoProps {
  consultaId: number;
  pacienteId: number;
}

export function AbaPerfilMetabolico({
  consultaId,
  pacienteId,
}: AbaPerfilMetabolicoProps) {
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

  const dataLabel = perfil?.dataExame
    ? new Date(perfil.dataExame).toLocaleDateString("pt-BR")
    : null;

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
