import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { RawBioimpedanceRow } from "./bioimpedance.types";

export function parseBioimpedanceXls(buffer: Buffer): RawBioimpedanceRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  return json.map((row) => ({
    timestamp: row["Tempo de pesagem"]
      ? dayjs(row["Tempo de pesagem"]).toDate()
      : new Date(),
    idade: Number(row["Idade (anos)"] ?? 0),
    alturaCm: Number(row["Altura (cm)"] ?? 0),
    pesoKg: Number(row["Peso corporal(kg)"] ?? 0),
    gorduraKg: Number(row["Teor de matérias gordas(kg)"] ?? 0),
    aguaKg: Number(row["Teor de água(kg)"] ?? 0),
    proteinaKg: Number(row["Teor proteico(kg)"] ?? 0),
    massaMuscularKg: Number(row["Massa muscular(kg)"] ?? 0),
    gorduraPercent: Number(
      row["Percentagem de gordura corporal (%)"] ?? 0
    ),
  }));
}
