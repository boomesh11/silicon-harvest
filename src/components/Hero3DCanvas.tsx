import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Activity, Zap, RotateCw, Layers } from 'lucide-react';

export interface Hero3DCanvasProps {
  compact?: boolean;
  initialAsset?: string;
}

const HARDWARE_3D_SLOTS = [
  {
    id: 'HERO_STM32',
    label: 'STM32F4 Levitating IC',
    spec: 'LQFP-64 • 0.51V QC Pass',
    src: '/assets/3d/hero-pcb.png',
    badge: '3D DIE STAGE',
  },
  {
    id: 'CAT_IC',
    label: 'ESP32 & Arduino Core',
    spec: 'ATmega328P • 16MHz XTAL',
    src: '/assets/3d/cat-ic.png',
    badge: 'MCU & ICs',
  },
  {
    id: 'CAT_APPLIANCE',
    label: 'Inverter Washer PCB',
    spec: '3-Phase IGBT + Relays',
    src: '/assets/3d/cat-appliance.png',
    badge: 'APPLIANCE PCB',
  },
  {
    id: 'CAT_SMPS',
    label: '24V 10A High-V SMPS',
    spec: 'IRF3205 + Copper Toroid',
    src: '/assets/3d/cat-smps.png',
    badge: 'POWER SMPS',
  },
  {
    id: 'CAT_BATTERY',
    label: '18650 4S 40A BMS Pack',
    spec: '2600mAh Tested Li-Ion',
    src: '/assets/3d/cat-battery.png',
    badge: 'CELLS & BMS',
  },
];

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({
  compact = false,
  initialAsset = '/assets/3d/hero-pcb.png',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(() => {
    const idx = HARDWARE_3D_SLOTS.findIndex((s) => s.src === initialAsset);
    return idx >= 0 ? idx : 0;
  });
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 8, ry: -10 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeSlot = HARDWARE_3D_SLOTS[selectedSlotIdx] || HARDWARE_3D_SLOTS[0];

  // Animated WebGL-style 3D circuit trace & telemetry particle backdrop canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.025;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Perspective 3D PCB grid lines
      ctx.strokeStyle = 'rgba(0, 245, 160, 0.12)';
      ctx.lineWidth = 1;
      const gridCount = 8;
      for (let i = 0; i <= gridCount; i++) {
        const y = (h / gridCount) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        const x = (w / gridCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Glowing signal traces & pulses
      const traces = [
        [
          { x: w * 0.08, y: h * 0.82 },
          { x: w * 0.28, y: h * 0.62 },
          { x: w * 0.5, y: h * 0.62 },
        ],
        [
          { x: w * 0.92, y: h * 0.2 },
          { x: w * 0.72, y: h * 0.4 },
          { x: w * 0.5, y: h * 0.4 },
        ],
        [
          { x: w * 0.14, y: h * 0.22 },
          { x: w * 0.34, y: h * 0.38 },
          { x: w * 0.5, y: h * 0.5 },
        ],
        [
          { x: w * 0.86, y: h * 0.8 },
          { x: w * 0.68, y: h * 0.65 },
          { x: w * 0.5, y: h * 0.5 },
        ],
      ];

      traces.forEach((pts, idx) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle =
          idx % 2 === 0 ? 'rgba(0, 245, 160, 0.35)' : 'rgba(255, 184, 0, 0.3)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Moving electron pulse along trace
        const pulse = (t * 0.6 + idx * 0.25) % 1;
        const seg = pulse < 0.5 ? 0 : 1;
        const localT = pulse < 0.5 ? pulse * 2 : (pulse - 0.5) * 2;
        const px = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * localT;
        const py = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * localT;

        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = idx % 2 === 0 ? '#00F5A0' : '#FFB800';
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setTilt((prev) => ({
        rx: Math.max(-24, Math.min(24, prev.rx - dy * 0.25)),
        ry: Math.max(-28, Math.min(28, prev.ry + dx * 0.25)),
      }));
      return;
    }

    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-ny * 18).toFixed(2)),
      ry: Number((nx * 22).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    isDraggingRef.current = false;
    setTilt({ rx: 8, ry: -10 });
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        isDraggingRef.current = false;
      }}
      onPointerLeave={handlePointerLeave}
      className="w-full rounded-2xl border border-white/15 bg-[#05070B]/95 p-3 sm:p-4 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ perspective: '1200px' }}
    >
      {/* Background Animated WebGL/Canvas Circuit Layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full opacity-80"
      />

      {/* Top Stage Telemetry Bar */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pb-2">
        <span className="flex items-center gap-1.5 text-[#00F5A0] font-bold">
          <Cpu className="w-3.5 h-3.5" />
          3D HARDWARE DIE &amp; PCB STAGE
        </span>
        <span className="flex items-center gap-1 text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
          <RotateCw className="w-3 h-3 text-[#00F5A0]" />
          Interactive 3D Tilt
        </span>
      </div>

      {/* 3D Perspective Floating Hardware Render Stage */}
      <div
        className={`relative z-10 w-full ${
          compact ? 'h-48 sm:h-52' : 'h-56 sm:h-64'
        } flex items-center justify-center my-1`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
          transition: isDraggingRef.current
            ? 'none'
            : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Ambient backplane glow at translateZ(-20px) */}
        <div
          className="absolute inset-4 rounded-2xl bg-gradient-to-tr from-[#00F5A0]/20 via-transparent to-[#FFB800]/15 blur-xl pointer-events-none"
          style={{ transform: 'translateZ(-20px)' }}
        />

        {/* Main 3D Studio Hardware Render elevated at translateZ(42px) */}
        {!imgError[activeSlot.src] ? (
          <img
            src={activeSlot.src}
            alt={activeSlot.label}
            onError={() =>
              setImgError((prev) => ({ ...prev, [activeSlot.src]: true }))
            }
            className="w-full h-full object-contain rounded-xl drop-shadow-[0_24px_35px_rgba(0,245,160,0.22)] pointer-events-none"
            style={{ transform: 'translateZ(42px)' }}
          />
        ) : (
          /* Procedural 3D SVG Fallback if custom image fails to load */
          <div
            className="w-4/5 h-4/5 rounded-2xl border border-[#00F5A0]/40 bg-[#0A1412]/90 flex flex-col items-center justify-center p-4 text-center shadow-2xl"
            style={{ transform: 'translateZ(42px)' }}
          >
            <Cpu className="w-12 h-12 text-[#00F5A0] mb-2 animate-pulse" />
            <div className="font-mono text-xs font-bold text-white">
              {activeSlot.label}
            </div>
            <div className="font-mono text-[10px] text-[#00F5A0] mt-1">
              {activeSlot.spec}
            </div>
          </div>
        )}

        {/* Floating 3D Telemetry Chip Badge at translateZ(65px) */}
        <div
          className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#07090E]/90 backdrop-blur-md border border-white/15 text-[10px] font-mono shadow-xl"
          style={{ transform: 'translateZ(65px)' }}
        >
          <div className="truncate">
            <span className="text-[#00F5A0] font-bold mr-1.5">
              [{activeSlot.badge}]
            </span>
            <span className="text-white font-semibold">{activeSlot.label}</span>
          </div>
          <span className="text-[#FFB800] font-bold shrink-0 ml-2">
            {activeSlot.spec}
          </span>
        </div>
      </div>

      {/* Bottom 3D Model Selector Pills */}
      {!compact && (
        <div className="relative z-10 grid grid-cols-5 gap-1.5 pt-2 border-t border-white/10 font-mono text-[10px]">
          {HARDWARE_3D_SLOTS.map((slot, idx) => {
            const isSelected = idx === selectedSlotIdx;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlotIdx(idx);
                }}
                className={`py-1.5 px-1.5 rounded-lg flex items-center justify-center gap-1 truncate transition-all ${
                  isSelected
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/50 font-bold shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {idx === 0 ? (
                  <Cpu className="w-3 h-3 shrink-0" />
                ) : idx === 1 ? (
                  <Activity className="w-3 h-3 shrink-0" />
                ) : idx === 2 ? (
                  <Layers className="w-3 h-3 shrink-0" />
                ) : (
                  <Zap className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{slot.badge.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Hero3DCanvas;

