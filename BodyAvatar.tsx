interface BodyAvatarProps {
  segmentalData: {
    bracoEsquerdo?: number;
    bracoDireito?: number;
    pernaEsquerda?: number;
    pernaDireita?: number;
    tronco?: number;
  };
  type?: "muscle" | "fat";
}

export default function BodyAvatar({ segmentalData, type = "muscle" }: BodyAvatarProps) {
  // Normalizar valores para escala de cores (0-150% = baixo a alto)
  const getColor = (value?: number) => {
    if (!value) return "#E5E7EB"; // Cinza para sem dados
    
    if (value < 80) return "#EF4444"; // Vermelho (baixo)
    if (value < 90) return "#F59E0B"; // Laranja (abaixo do normal)
    if (value < 110) return "#10B981"; // Verde (normal)
    if (value < 120) return "#3B82F6"; // Azul (acima do normal)
    return "#8B5CF6"; // Roxo (alto)
  };

  const bracoEsqColor = getColor(segmentalData.bracoEsquerdo);
  const bracoDirColor = getColor(segmentalData.bracoDireito);
  const pernaEsqColor = getColor(segmentalData.pernaEsquerda);
  const pernaDirColor = getColor(segmentalData.pernaDireita);
  const troncoColor = getColor(segmentalData.tronco);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar SVG */}
      <svg
        width="200"
        height="400"
        viewBox="0 0 200 400"
        className="mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cabeça */}
        <circle cx="100" cy="40" r="25" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="2" />
        
        {/* Tronco */}
        <rect
          x="70"
          y="65"
          width="60"
          height="100"
          rx="10"
          fill={troncoColor}
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Braço Esquerdo */}
        <rect
          x="35"
          y="70"
          width="30"
          height="80"
          rx="15"
          fill={bracoEsqColor}
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Braço Direito */}
        <rect
          x="135"
          y="70"
          width="30"
          height="80"
          rx="15"
          fill={bracoDirColor}
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Perna Esquerda */}
        <rect
          x="75"
          y="170"
          width="20"
          height="120"
          rx="10"
          fill={pernaEsqColor}
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Perna Direita */}
        <rect
          x="105"
          y="170"
          width="20"
          height="120"
          rx="10"
          fill={pernaDirColor}
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Labels */}
        <text x="50" y="110" fontSize="10" fill="#374151" textAnchor="middle">
          {segmentalData.bracoEsquerdo?.toFixed(1) || "N/A"}
        </text>
        <text x="150" y="110" fontSize="10" fill="#374151" textAnchor="middle">
          {segmentalData.bracoDireito?.toFixed(1) || "N/A"}
        </text>
        <text x="100" y="120" fontSize="10" fill="#374151" textAnchor="middle">
          {segmentalData.tronco?.toFixed(1) || "N/A"}
        </text>
        <text x="85" y="235" fontSize="10" fill="#374151" textAnchor="middle">
          {segmentalData.pernaEsquerda?.toFixed(1) || "N/A"}
        </text>
        <text x="115" y="235" fontSize="10" fill="#374151" textAnchor="middle">
          {segmentalData.pernaDireita?.toFixed(1) || "N/A"}
        </text>
      </svg>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#EF4444" }}></div>
          <span>Baixo (&lt;80%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F59E0B" }}></div>
          <span>Abaixo (80-90%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10B981" }}></div>
          <span>Normal (90-110%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3B82F6" }}></div>
          <span>Acima (110-120%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#8B5CF6" }}></div>
          <span>Alto (&gt;120%)</span>
        </div>
      </div>

      {/* Título */}
      <p className="text-sm font-semibold text-gray-700 text-center">
        {type === "muscle" ? "Distribuição de Massa Muscular" : "Distribuição de Gordura"}
      </p>
    </div>
  );
}
