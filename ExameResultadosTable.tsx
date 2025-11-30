import { CardContent } from "@/components/ui/card";

type Resultado = {
  id?: number;
  parametro: string;
  valor: string;
  unidade?: string;
  referencia?: string;
  status?: string;
};

type Props = {
  resultados: Resultado[];
  compact?: boolean;
};

export function ExameResultadosTable({ resultados, compact }: Props) {
  if (!Array.isArray(resultados) || resultados.length === 0) return null;

  return (
    <CardContent className={compact ? "pt-0 pb-3" : "pt-0 pb-4"}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="text-gray-500">
            <tr>
              <th className="pb-2 pr-4 font-semibold">ID</th>
              <th className="pb-2 pr-4 font-semibold">Parâmetro</th>
              <th className="pb-2 pr-4 font-semibold">Valor</th>
              <th className="pb-2 pr-4 font-semibold">Unidade</th>
              <th className="pb-2 pr-4 font-semibold">Referência</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resultados.map((r, idx) => (
              <tr key={r.id ?? idx}>
                <td className="py-2 pr-4">{r.id ?? "-"}</td>
                <td className="py-2 pr-4">{r.parametro}</td>
                <td className="py-2 pr-4">{r.valor}</td>
                <td className="py-2 pr-4">{r.unidade}</td>
                <td className="py-2 pr-4">{r.referencia}</td>
                <td className="py-2 capitalize">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  );
}
