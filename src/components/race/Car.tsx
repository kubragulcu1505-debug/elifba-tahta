// Araba çizimleri (sağa bakar). Gövde rengi ve kapıdaki numara oyuncunun seçimidir.
import type { CarType } from "@/lib/tug";

export const CAR_TYPES: { id: CarType; label: string }[] = [
  { id: "racer", label: "Yarış arabası" },
  { id: "jeep", label: "Jip" },
  { id: "pickup", label: "Kamyonet" },
  { id: "bus", label: "Otobüs" },
  { id: "truck", label: "Kamyon" },
];

export const CAR_COLORS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"];

const GLASS = "#bae6fd";
const TIRE = "#1f2937";

function Wheels({ xs, y = 40, r = 7 }: { xs: number[]; y?: number; r?: number }) {
  return (
    <>
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill={TIRE} />
          <circle cx={x} cy={y} r={r * 0.42} fill="#d1d5db" />
        </g>
      ))}
    </>
  );
}

function Plate({ x, y, number }: { x: number; y: number; number: string }) {
  if (!number) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <text x={x} y={y + 3.2} textAnchor="middle" fontSize="9" fontWeight="900" fill="#1f2937">
        {number.slice(0, 2)}
      </text>
    </g>
  );
}

export function Car({ type, color, number = "" }: { type: CarType; color: string; number?: string }) {
  const stroke = "#1f2937";
  return (
    <svg viewBox="0 0 100 50" aria-hidden="true" overflow="visible">
      {type === "racer" && (
        <>
          <path d="M4 36 L10 26 L36 22 L48 12 L66 12 L76 22 L94 26 L97 36 Z" fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 15 L64 15 L71 22 L44 22 Z" fill={GLASS} stroke={stroke} strokeWidth="1.5" />
          <path d="M2 22 L12 22 L12 27 L4 28 Z" fill={stroke} />
          <Plate x={30} y={30} number={number} />
          <Wheels xs={[22, 80]} />
        </>
      )}
      {type === "jeep" && (
        <>
          <rect x="8" y="14" width="82" height="24" rx="4" fill={color} stroke={stroke} strokeWidth="2" />
          <rect x="44" y="4" width="36" height="12" rx="2" fill={color} stroke={stroke} strokeWidth="2" />
          <rect x="48" y="6" width="13" height="8" fill={GLASS} />
          <rect x="64" y="6" width="13" height="8" fill={GLASS} />
          <circle cx="6" cy="24" r="6" fill={TIRE} />
          <Plate x={28} y={26} number={number} />
          <Wheels xs={[24, 76]} r={8} />
        </>
      )}
      {type === "pickup" && (
        <>
          <path d="M4 18 L50 18 L50 36 L4 36 Z" fill={color} stroke={stroke} strokeWidth="2" />
          <path d="M50 36 L50 8 L74 8 L86 20 L96 22 L96 36 Z" fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M55 11 L72 11 L81 20 L55 20 Z" fill={GLASS} stroke={stroke} strokeWidth="1.5" />
          <Plate x={26} y={27} number={number} />
          <Wheels xs={[22, 80]} />
        </>
      )}
      {type === "bus" && (
        <>
          <rect x="2" y="4" width="94" height="34" rx="5" fill={color} stroke={stroke} strokeWidth="2" />
          {[8, 24, 40, 56, 72].map((x) => (
            <rect key={x} x={x} y="9" width="12" height="10" rx="1.5" fill={GLASS} />
          ))}
          <rect x="86" y="9" width="8" height="16" rx="1.5" fill={GLASS} />
          <Plate x={46} y={29} number={number} />
          <Wheels xs={[18, 78]} />
        </>
      )}
      {type === "truck" && (
        <>
          <rect x="2" y="6" width="64" height="30" rx="2" fill="#e5e7eb" stroke={stroke} strokeWidth="2" />
          <rect x="6" y="10" width="56" height="22" fill={color} opacity="0.35" />
          <path d="M66 36 L66 12 L86 12 L96 24 L96 36 Z" fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M70 15 L84 15 L91 24 L70 24 Z" fill={GLASS} stroke={stroke} strokeWidth="1.5" />
          <Plate x={34} y={21} number={number} />
          <Wheels xs={[14, 34, 82]} />
        </>
      )}
    </svg>
  );
}
