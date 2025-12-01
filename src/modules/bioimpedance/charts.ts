import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

const WIDTH = 800;
const HEIGHT_LINE = 220;
const HEIGHT_RADAR = 260;

const chartNodeCanvasLine = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT_LINE,
  backgroundColour: "white",
});
const chartNodeCanvasRadar = new ChartJSNodeCanvas({
  width: 600,
  height: HEIGHT_RADAR,
  backgroundColour: "white",
});

export async function makeLineChartBase64(
  labels: string[],
  datasets: { label: string; data: number[]; color: string }[],
  title: string
): Promise<string> {
  const config: ChartConfiguration = {
    type: "line",
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color,
        tension: 0.2,
        pointRadius: 3,
        borderWidth: 1.5,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: title, font: { size: 11 } },
        legend: { display: datasets.length > 1, position: "top" },
      },
      scales: {
        x: { ticks: { font: { size: 9 } } },
        y: { ticks: { font: { size: 9 } } },
      },
    },
  };

  const buffer = await chartNodeCanvasLine.renderToBuffer(config);
  return buffer.toString("base64");
}

export async function makeRadarChartBase64(
  labels: string[],
  data: number[]
): Promise<string> {
  const config: ChartConfiguration = {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Perfil clínico",
          data,
          borderColor: "#2c5aa0",
          backgroundColor: "rgba(44,90,160,0.25)",
          pointRadius: 3,
          borderWidth: 1.7,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          pointLabels: {
            font: { size: 9 },
            color: "#333",
          },
        },
      },
    },
  };

  const buffer = await chartNodeCanvasRadar.renderToBuffer(config);
  return buffer.toString("base64");
}
