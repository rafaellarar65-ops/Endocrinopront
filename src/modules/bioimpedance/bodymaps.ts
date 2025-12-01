export function makeFatBodymapSvg(): string {
  return `
<svg viewBox="0 0 140 320" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#555" stroke-width="1.2">
    <path d="M70 20 C 80 22 86 30 86 40 L 86 70 C 86 90 92 105 96 120 C 100 135 100 150 98 170 L 95 210 C 93 230 90 255 86 280 L 70 300 L 54 280 C 50 255 47 230 45 210 L 42 170 C 40 150 40 135 44 120 C 48 105 54 90 54 70 L 54 40 C 54 30 60 22 70 20 Z" />
  </g>
  <circle cx="70" cy="18" r="12" fill="#f28b82" opacity="0.8"/>
  <path d="M56 45 H84 V110 C84 125 80 135 70 140 C60 135 56 125 56 110 Z" fill="#f28b82" opacity="0.55"/>
  <rect x="42" y="50" width="10" height="60" rx="5" fill="#fbbc04" opacity="0.8"/>
  <rect x="88" y="50" width="10" height="60" rx="5" fill="#fbbc04" opacity="0.8"/>
  <path d="M58 110 H82 V140 C82 148 76 155 70 155 C64 155 58 148 58 140 Z" fill="#f28b82" opacity="0.6"/>
  <rect x="58" y="155" width="10" height="80" rx="6" fill="#fbbc04" opacity="0.8"/>
  <rect x="72" y="155" width="10" height="80" rx="6" fill="#fbbc04" opacity="0.8"/>
  <line x1="40" y1="80" x2="20" y2="80" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="82" font-size="7" text-anchor="end" fill="#555">Braços</text>
  <line x1="40" y1="120" x2="20" y2="120" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="122" font-size="7" text-anchor="end" fill="#555">Tronco</text>
  <line x1="40" y1="190" x2="20" y2="190" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="192" font-size="7" text-anchor="end" fill="#555">Pernas</text>
</svg>`.trim();
}

export function makeMuscleBodymapSvg(): string {
  return `
<svg viewBox="0 0 140 320" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#555" stroke-width="1.2">
    <path d="M70 20 C 80 22 86 30 86 40 L 86 70 C 86 90 92 105 96 120 C 100 135 100 150 98 170 L 95 210 C 93 230 90 255 86 280 L 70 300 L 54 280 C 50 255 47 230 45 210 L 42 170 C 40 150 40 135 44 120 C 48 105 54 90 54 70 L 54 40 C 54 30 60 22 70 20 Z" />
  </g>
  <circle cx="70" cy="18" r="12" fill="#4fc3f7" opacity="0.9"/>
  <path d="M56 45 H84 V110 C84 125 80 135 70 140 C60 135 56 125 56 110 Z" fill="#4fc3f7" opacity="0.55"/>
  <rect x="42" y="50" width="10" height="60" rx="5" fill="#1976d2" opacity="0.8"/>
  <rect x="88" y="50" width="10" height="60" rx="5" fill="#1976d2" opacity="0.8"/>
  <path d="M58 110 H82 V140 C82 148 76 155 70 155 C64 155 58 148 58 140 Z" fill="#4fc3f7" opacity="0.6"/>
  <rect x="58" y="155" width="10" height="80" rx="6" fill="#1976d2" opacity="0.85"/>
  <rect x="72" y="155" width="10" height="80" rx="6" fill="#1976d2" opacity="0.85"/>
  <line x1="40" y1="80" x2="20" y2="80" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="82" font-size="7" text-anchor="end" fill="#555">Braços</text>
  <line x1="40" y1="120" x2="20" y2="120" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="122" font-size="7" text-anchor="end" fill="#555">Tronco</text>
  <line x1="40" y1="190" x2="20" y2="190" stroke="#888" stroke-width="0.8"/>
  <text x="16" y="192" font-size="7" text-anchor="end" fill="#555">Pernas</text>
</svg>`.trim();
}
