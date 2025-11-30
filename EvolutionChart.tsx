import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EvolutionChartProps {
  data: Array<{
    date: string;
    value: number | null;
  }>;
  label: string;
  color: string;
  unit: string;
  title: string;
}

export default function EvolutionChart({
  data,
  label,
  color,
  unit,
  title,
}: EvolutionChartProps) {
  // Filtrar dados nulos e ordenar por data
  const validData = data
    .filter((d) => d.value !== null && d.value !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (validData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Sem dados suficientes para exibir o gráfico</p>
      </div>
    );
  }

  const chartData = {
    labels: validData.map((d) =>
      new Date(d.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    ),
    datasets: [
      {
        label,
        data: validData.map((d) => d.value),
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 14,
          weight: "bold",
        },
        color: "#1f2937",
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => {
            return `${label}: ${context.parsed.y} ${unit}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value} ${unit}`,
          font: {
            size: 11,
          },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
