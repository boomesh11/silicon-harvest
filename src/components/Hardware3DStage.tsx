import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Activity, Zap, RotateCw } from 'lucide-react';

interface Hardware3DStageProps {
  activeBoardsCount: number;
  intactComponentsCount: number;
  onSelectPillar: (pillar: 'SELL' | 'PROCURE' | 'BARGAIN' | 'TRACK') => void;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const Hardware3DStage: React.FC<Hardware3DStageProps> = ({
  activeBoardsCount,
  intactComponentsCount,
  onSelectPillar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<{ rx: number; ry: number; targetRx: number; targetRy: number }>({
    rx: 0.58,
    ry: -0.45,
    targetRx: 0.58,
    targetRy: -0.45,
  });
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [inspectMode, setInspectMode] = useState<'THERMAL_QC' | 'TRACE_CONTINUITY' | 'PINOUT_3D'>('TRACE_CONTINUITY');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const project = (
      p: Vec3,
      rx: number,
      ry: number,
      width: number,
      height: number
    ): { x: number; y: number; z: number; scale: number } => {
      // Rotate around Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.z * cosY + p.x * sinY;

      // Rotate around X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + p.y * sinX;

      const fov = 420;
      const viewerDist = 360;
      const scale = fov / Math.max(80, viewerDist + z2);

      return {
        x: width / 2 + x1 * scale,
        y: height / 2 + y2 * scale,
        z: z2,
        scale,
      };
    };

    const drawBox3D = (
      cx: number,
      cy: number,
      cz: number,
      w: number,
      h: number,
      d: number,
      rx: number,
      ry: number,
      width: number,
      height: number,
      topColor: string,
      sideColor: string,
      strokeColor: string
    ) => {
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;

      const vertices: Vec3[] = [
        { x: cx - hw, y: cy - hh, z: cz - hd },
        { x: cx + hw, y: cy - hh, z: cz - hd },
        { x: cx + hw, y: cy - hh, z: cz + hd },
        { x: cx - hw, y: cy - hh, z: cz + hd },
        { x: cx - hw, y: cy + hh, z: cz - hd },
        { x: cx + hw, y: cy + hh, z: cz - hd },
        { x: cx + hw, y: cy + hh, z: cz + hd },
        { x: cx - hw, y: cy + hh, z: cz + hd },
      ];

      const p = vertices.map((v) => project(v, rx, ry, width, height));

      // Front/Side faces
      const faces = [
        { idx: [4, 5, 6, 7], color: sideColor }, // Bottom
        { idx: [0, 1, 5, 4], color: sideColor }, // North
        { idx: [1, 2, 6, 5], color: sideColor }, // East
        { idx: [2, 3, 7, 6], color: sideColor }, // South
        { idx: [3, 0, 4, 7], color: sideColor }, // West
        { idx: [0, 1, 2, 3], color: topColor },  // Top surface
      ];

      faces.forEach((face) => {
        ctx.beginPath();
        ctx.moveTo(p[face.idx[0]].x, p[face.idx[0]].y);
        for (let i = 1; i < face.idx.length; i++) {
          ctx.lineTo(p[face.idx[i]].x, p[face.idx[i]].y);
        }
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const render = () => {
      time += 0.022;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      // Smooth interpolation + subtle orbital breathing when idle
      if (!isDraggingRef.current) {
        rotationRef.current.targetRy += 0.0035;
      }
      rotationRef.current.rx += (rotationRef.current.targetRx - rotationRef.current.rx) * 0.09;
      rotationRef.current.ry += (rotationRef.current.targetRy - rotationRef.current.ry) * 0.09;

      const { rx, ry } = rotationRef.current;

      // Clear stage
      ctx.clearRect(0, 0, width, height);

      // Ambient radial glow under PCB
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.55
      );
      grad.addColorStop(0, inspectMode === 'THERMAL_QC' ? 'rgba(255, 184, 0, 0.14)' : 'rgba(0, 245, 160, 0.14)');
      grad.addColorStop(0.55, 'rgba(7, 9, 14, 0.4)');
      grad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 1. Matte FR4 Solder-Mask PCB Substrate Board
      drawBox3D(
        0,
        6,
        0,
        220,
        10,
        160,
        rx,
        ry,
        width,
        height,
        '#0A131A',
        '#062920',
        'rgba(0, 245, 160, 0.38)'
      );

      // 2. Electroluminescent Copper/Emerald Circuit Traces on Top Surface (y = 0)
      const traces: Vec3[][] = [
        [
          { x: -35, y: 0, z: -20 },
          { x: -75, y: 0, z: -20 },
          { x: -92, y: 0, z: -48 },
        ],
        [
          { x: -35, y: 0, z: 0 },
          { x: -85, y: 0, z: 0 },
          { x: -95, y: 0, z: 32 },
        ],
        [
          { x: 35, y: 0, z: -15 },
          { x: 78, y: 0, z: -15 },
          { x: 92, y: 0, z: -45 },
        ],
        [
          { x: 35, y: 0, z: 18 },
          { x: 75, y: 0, z: 18 },
          { x: 90, y: 0, z: 50 },
        ],
        [
          { x: 0, y: 0, z: -35 },
          { x: 0, y: 0, z: -65 },
          { x: 45, y: 0, z: -65 },
        ],
        [
          { x: -12, y: 0, z: 35 },
          { x: -12, y: 0, z: 65 },
          { x: -58, y: 0, z: 65 },
        ],
      ];

      traces.forEach((trace, idx) => {
        const pts = trace.map((pt) => project(pt, rx, ry, width, height));
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle =
          inspectMode === 'THERMAL_QC'
            ? 'rgba(255, 184, 0, 0.55)'
            : 'rgba(0, 245, 160, 0.52)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gold Via Pad at trace endpoint
        const endPt = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 3.2 * endPt.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB800';
        ctx.fill();

        // Animated signal pulse along trace
        const tPulse = (time * 0.65 + idx * 0.25) % 1;
        const segIdx = tPulse < 0.5 ? 0 : 1;
        const segT = tPulse < 0.5 ? tPulse * 2 : (tPulse - 0.5) * 2;
        const pStart = pts[segIdx];
        const pEnd = pts[segIdx + 1];
        if (pStart && pEnd) {
          const px = pStart.x + (pEnd.x - pStart.x) * segT;
          const py = pStart.y + (pEnd.y - pStart.y) * segT;
          ctx.beginPath();
          ctx.arc(px, py, 3 * pStart.scale, 0, Math.PI * 2);
          ctx.fillStyle = inspectMode === 'THERMAL_QC' ? '#FFB800' : '#00F5A0';
          ctx.shadowColor = inspectMode === 'THERMAL_QC' ? '#FFB800' : '#00F5A0';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 3. Gold-Plated QFP-32 Microcontroller Leads (#FFB800)
      for (let i = -3; i <= 3; i++) {
        const offset = i * 9;
        // Left & Right leads
        drawBox3D(-40, -1, offset, 10, 2, 3.5, rx, ry, width, height, '#FFB800', '#B47B00', '#FFD166');
        drawBox3D(40, -1, offset, 10, 2, 3.5, rx, ry, width, height, '#FFB800', '#B47B00', '#FFD166');
        // Top & Bottom leads
        drawBox3D(offset, -1, -40, 3.5, 2, 10, rx, ry, width, height, '#FFB800', '#B47B00', '#FFD166');
        drawBox3D(offset, -1, 40, 3.5, 2, 10, rx, ry, width, height, '#FFB800', '#B47B00', '#FFD166');
      }

      // 4. Central Silicon MCU Package (ATmega328P / STM32 Core)
      drawBox3D(
        0,
        -6,
        0,
        70,
        12,
        70,
        rx,
        ry,
        width,
        height,
        inspectMode === 'THERMAL_QC' ? '#2A1810' : '#131924',
        '#0B0F17',
        inspectMode === 'THERMAL_QC' ? '#FFB800' : '#00F5A0'
      );

      // 5. Peripheral SMD Capacitors & Inductors
      drawBox3D(-72, -5, -38, 22, 10, 14, rx, ry, width, height, '#1F2937', '#111827', '#FFB800');
      drawBox3D(72, -5, 36, 22, 10, 14, rx, ry, width, height, '#1F2937', '#111827', '#00F5A0');
      drawBox3D(68, -6, -38, 24, 12, 24, rx, ry, width, height, '#182232', '#0F172A', 'rgba(255,255,255,0.28)');

      // Pin 1 Laser Orientation Dot on IC
      const pin1Dot = project({ x: -24, y: -12.5, z: -24 }, rx, ry, width, height);
      ctx.beginPath();
      ctx.arc(pin1Dot.x, pin1Dot.y, 3.5 * pin1Dot.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#00F5A0';
      ctx.fill();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [inspectMode]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) {
      // Subtle tilt on hover even without dragging
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      rotationRef.current.targetRx = Math.max(0.25, Math.min(1.05, 0.58 + ny * 0.35));
      rotationRef.current.targetRy += nx * 0.015;
      return;
    }
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.targetRy += dx * 0.012;
    rotationRef.current.targetRx = Math.max(
      0.2,
      Math.min(1.15, rotationRef.current.targetRx + dy * 0.01)
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-[#07090E] text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden relative">
      {/* Subtle Anodized Metallic Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 sm:p-8 lg:p-10">
        {/* Left Column: Engineering Mission & 4-Pillar Action Console */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[11px] font-mono uppercase tracking-widest text-[#00F5A0]">
            <span className="h-2 w-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>FR4-GRADE TRACEABLE SALVAGE NETWORK • ZERO E-WASTE</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-[1.12]">
            Valuable Components Get Lost the Moment They Stop Moving.{' '}
            <span className="text-[#00F5A0]">
              SiliconHarvest Keeps Them Moving.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            India&apos;s connected semiconductor &amp; appliance spares exchange. Procure multimeter-verified ICs, inverter PCBs, and Li-Ion cells—or monetize dead donor boards in 30 seconds with same-district bike dispatch.
          </p>

          {/* Live Telemetry Readout Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-xs tabular-nums">
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">LIVE DONOR BOARDS</span>
              <span className="text-white font-bold text-sm">{activeBoardsCount} UNITS</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">VERIFIED SILICON NODES</span>
              <span className="text-[#00F5A0] font-bold text-sm">{intactComponentsCount} INTACT</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">DIODE DROP QC</span>
              <span className="text-[#FFB800] font-bold text-sm">0.512V PASS</span>
            </div>
          </div>

          {/* 4-Pillar Action Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onSelectPillar('SELL')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                01 // SELL SPARES
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                List in 30s →
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fair range slider</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('PROCURE')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                02 // PROCURE PARTS
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                Inspect Nodes ↓
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tested ICs &amp; PCBs</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('BARGAIN')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#FFB800]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FFB800]">
                03 // BARGAIN &amp; PRO
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#FFB800] transition-colors">
                Unlock WhatsApp ⭐
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">₹0 platform fee</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('TRACK')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                04 // TRACK DISPATCH
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                Live Courier →
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Rapido ₹35 / Post ₹45</div>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive 3D Hardware Stage */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full rounded-2xl border border-white/15 bg-[#05070B]/90 p-3 relative overflow-hidden">
            {/* Top Stage Telemetry Header */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-2 pb-1">
              <span className="flex items-center gap-1.5 text-[#00F5A0]">
                <Cpu className="w-3.5 h-3.5" />
                3D SILICON DIE &amp; PCB STAGE
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <RotateCw className="w-3 h-3" />
                Drag to Rotate 3D
              </span>
            </div>

            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-56 sm:h-64 cursor-grab active:cursor-grabbing touch-none"
            />

            {/* Bottom Mode Switcher inside 3D Stage */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setInspectMode('TRACE_CONTINUITY')}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  inspectMode === 'TRACE_CONTINUITY'
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Traces</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectMode('THERMAL_QC')}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  inspectMode === 'THERMAL_QC'
                    ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-bold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>315°C Reflow</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  rotationRef.current.targetRx = 0.58;
                  rotationRef.current.targetRy = -0.45;
                  setInspectMode('PINOUT_3D');
                }}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  inspectMode === 'PINOUT_3D'
                    ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 font-bold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>QFP-32 Gold</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
