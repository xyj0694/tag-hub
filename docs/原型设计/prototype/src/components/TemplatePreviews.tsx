// 模板 SVG 图稿预览（简化版，用于弹窗等小空间展示）

interface Field { name: string; label: string; type: string; required: boolean; }

function HangTagThumb({ fields, large }: { fields: Field[]; large?: boolean }) {
  const w = large ? 560 : 170;
  const h = large ? 800 : 250;
  return (
    <svg width={w} height={h} viewBox="0 0 140 200" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
      <line x1="70" y1="0" x2="70" y2="12" stroke="#aaa" strokeWidth="2" strokeDasharray="3,2" strokeLinecap="round" />
      <ellipse cx="70" cy="5" rx="4" ry="2" fill="none" stroke="#bbb" strokeWidth="1" />
      <rect x="8" y="12" width="124" height="185" rx="8" fill="white" stroke="#d9d9d9" strokeWidth="1" />
      <circle cx="70" cy="28" r="6" fill="white" stroke="#d0d0d0" strokeWidth="1.5" />
      <rect x="18" y="42" width="104" height="18" rx="4" fill="#f4fafa" />
      <text x="70" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="#008089" letterSpacing="2">BOSIDENG</text>
      <text x="70" y="72" textAnchor="middle" fontSize="8" fontWeight="600" fill="#333">RFID 吊牌标签</text>
      <line x1="22" y1="78" x2="118" y2="78" stroke="#eee" strokeWidth="0.8" />
      {fields.slice(0, 5).map((f, i) => (
        <g key={f.name}>
          <text x="24" y={92 + i * 16} fontSize="7" fontWeight="500" fill="#555">
            {f.required && <tspan fill="#ff4d4f" fontSize="6">* </tspan>}{f.label}
          </text>
          <line x1="68" y1={92 + i * 16 - 2} x2="116" y2={92 + i * 16 - 2} stroke="#e8e8e8" strokeWidth="0.5" />
        </g>
      ))}
      <rect x="30" y={92 + Math.min(fields.length, 5) * 16} width="80" height="18" rx="2" fill="#fafafa" stroke="#e8e8e8" strokeWidth="0.5" />
      {[...Array(12)].map((_, i) => (
        <line key={i} x1={34 + i * 6.5} y1={94 + Math.min(fields.length, 5) * 16}
          x2={34 + i * 6.5} y2={108 + Math.min(fields.length, 5) * 16}
          stroke={i % 3 === 0 ? '#2c2c2c' : '#888'} strokeWidth={i % 3 === 0 ? 1.2 : 0.6} />
      ))}
    </svg>
  );
}

function StickerThumb({ fields, large }: { fields: Field[]; large?: boolean }) {
  const w = large ? 600 : 170;
  const h = large ? 640 : 185;
  return (
    <svg width={w} height={h} viewBox="0 0 150 160" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
      <rect x="6" y="4" width="138" height="152" rx="4" fill="#faf1d8" stroke="#e0cc90" strokeWidth="0.8" />
      <rect x="12" y="8" width="126" height="144" rx="6" fill="white" stroke="#f5a623" strokeWidth="1.2" />
      <text x="75" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#333" letterSpacing="2">BOSIDENG</text>
      <line x1="28" y1="30" x2="122" y2="30" stroke="#f5a623" strokeWidth="0.6" strokeDasharray="4,2" />
      {fields.slice(0, 3).map((f, i) => {
        const x = i % 2 === 0 ? 28 : 85;
        const y = 44 + Math.floor(i / 2) * 20;
        return (
          <g key={f.name}>
            <text x={x} y={y} fontSize="6.5" fontWeight="500" fill="#555">
              {f.required && <tspan fill="#ff4d4f" fontSize="5">* </tspan>}{f.label}
            </text>
            <line x1={x + 30} y1={y - 2} x2={i % 2 === 0 ? 72 : 130} y2={y - 2} stroke="#e8e8e8" strokeWidth="0.5" />
          </g>
        );
      })}
      <rect x="26" y={62 + Math.ceil(fields.length / 2) * 20} width="60" height="16" rx="2" fill="#fafafa" stroke="#e8e8e8" strokeWidth="0.5" />
      {[...Array(10)].map((_, i) => (
        <line key={i} x1={30 + i * 5.8} y1={64 + Math.ceil(fields.length / 2) * 20}
          x2={30 + i * 5.8} y2={76 + Math.ceil(fields.length / 2) * 20}
          stroke={i % 3 === 0 ? '#2c2c2c' : '#888'} strokeWidth={i % 3 === 0 ? 1 : 0.5} />
      ))}
    </svg>
  );
}

function CareLabelThumb({ fields, large }: { fields: Field[]; large?: boolean }) {
  const w = large ? 480 : 140;
  const h = large ? 800 : 235;
  return (
    <svg width={w} height={h} viewBox="0 0 120 200" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
      <rect x="10" y="8" width="100" height="187" rx="4" fill="#fefcf5" stroke="#d4c8a0" strokeWidth="1.2" />
      <rect x="14" y="12" width="92" height="179" rx="2" fill="white" stroke="#e8d8b0" strokeWidth="0.8" />
      <text x="60" y="30" textAnchor="middle" fontSize="8" fontWeight="700" fill="#555" letterSpacing="1">BOSIDENG</text>
      <line x1="24" y1="36" x2="96" y2="36" stroke="#e8d8b0" strokeWidth="0.6" />
      {fields.slice(0, 6).map((f, i) => (
        <g key={f.name}>
          <text x="22" y={52 + i * 15} fontSize="7" fontWeight="500" fill="#555">
            {f.required && <tspan fill="#ff4d4f" fontSize="5">* </tspan>}{f.label}
          </text>
          <line x1="60" y1={52 + i * 15 - 2} x2="94" y2={52 + i * 15 - 2} stroke="#e8e8e8" strokeWidth="0.5" />
        </g>
      ))}
      <g transform={`translate(22, ${54 + Math.min(fields.length, 6) * 15})`}>
        <rect x="0" y="0" width="18" height="18" rx="2" fill="#f8f8f8" stroke="#ddd" strokeWidth="0.5" />
        <text x="9" y="12" textAnchor="middle" fontSize="8" fill="#888">30°</text>
      </g>
      <g transform={`translate(44, ${54 + Math.min(fields.length, 6) * 15})`}>
        <rect x="0" y="0" width="18" height="18" rx="2" fill="#f8f8f8" stroke="#ddd" strokeWidth="0.5" />
        <text x="9" y="12" textAnchor="middle" fontSize="8" fill="#888">⬡</text>
      </g>
      <g transform={`translate(66, ${54 + Math.min(fields.length, 6) * 15})`}>
        <rect x="0" y="0" width="18" height="18" rx="2" fill="#f8f8f8" stroke="#ddd" strokeWidth="0.5" />
        <text x="9" y="12" textAnchor="middle" fontSize="8" fill="#888">✕</text>
      </g>
    </svg>
  );
}

export default function TemplateThumbnail({ type, fields, large }: { type: string; fields: Field[]; large?: boolean }) {
  if (type === '吊牌标签') return <HangTagThumb fields={fields} large={large} />;
  if (type === '不干胶贴纸标签') return <StickerThumb fields={fields} large={large} />;
  if (type === '洗麦标签') return <CareLabelThumb fields={fields} large={large} />;
  return null;
}
