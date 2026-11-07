import React, { useState, useRef } from 'react';
import { Cpu, Layers, BatteryCharging, Zap, Sparkles, Move3d } from 'lucide-react';

export type StudioCategoryKey = 'ICS_MCUS' | 'APPLIANCE_PCBS' | 'LI_ION_CELLS' | 'SMPS_POWER';

export interface Real3DHardwareStageProps {
  onSelectCategory?: (categoryKey: StudioCategoryKey) => void;
}

interface CategorySpec {
  key: StudioCategoryKey;
  label: string;
  calloutTitle: string;
  calloutSubtitle: string;
  substrateColor: string;
  substrateBorder: string;
  substrateSideColor: string;
  traceColor: string;
}

const STUDIO_CATEGORIES: CategorySpec[] = [
  {
    key: 'ICS_MCUS',
    label: 'ICs & MCUs',
    calloutTitle: 'ATmega328P / STM32 • Bench Tested',
    calloutSubtitle: 'QFP-64 & DIP-28 • 3.3V / 5V Logic Verified',
    substrateColor: 'linear-gradient(135deg, #0F3F30 0%, #0A291F 55%, #071F17 100%)',
    substrateBorder: '#1E6B52',
    substrateSideColor: '#061B14',
    traceColor: '#34D399',
  },
  {
    key: 'APPLIANCE_PCBS',
    label: 'Appliance PCBs',
    calloutTitle: 'Omron G5Q Relays & IGBT Module • Tested',
    calloutSubtitle: 'Inverter Washer / AC Control • Coil QC Pass',
    substrateColor: 'linear-gradient(135deg, #1E3A5F 0%, #152C4A 55%, #0F2138 100%)',
    substrateBorder: '#3B6EA5',
    substrateSideColor: '#0B1829',
    traceColor: '#60A5FA',
  },
  {
    key: 'LI_ION_CELLS',
    label: 'Li-Ion Cells',
    calloutTitle: '18650 4S 40A BMS Array • IR Verified',
    calloutSubtitle: 'Nickel Spot-Welded Busbars • 3.7V Nominal',
    substrateColor: 'linear-gradient(135deg, #1E293B 0%, #0F172A 60%, #090D16 100%)',
    substrateBorder: '#475569',
    substrateSideColor: '#090D16',
    traceColor: '#10B981',
  },
  {
    key: 'SMPS_POWER',
    label: 'SMPS Power',
    calloutTitle: '24V 10A Toroidal SMPS • Load Tested',
    calloutSubtitle: '400V Primary Caps • IRF3205 MOSFET Stage',
    substrateColor: 'linear-gradient(135deg, #14382D 0%, #0D261E 55%, #081A14 100%)',
    substrateBorder: '#2D6A56',
    substrateSideColor: '#06140F',
    traceColor: '#F59E0B',
  },
];

export const Real3DHardwareStage: React.FC<Real3DHardwareStageProps> = ({
  onSelectCategory,
}) => {
  const [activeCat, setActiveCat] = useState<StudioCategoryKey>('ICS_MCUS');
  const [isHovered, setIsHovered] = useState(false);
  const [isExplodedManual, setIsExplodedManual] = useState(false);
  const [rotation, setRotation] = useState<{ rx: number; ry: number; rz: number }>({
    rx: 54,
    ry: 0,
    rz: -34,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentSpec =
    STUDIO_CATEGORIES.find((c) => c.key === activeCat) || STUDIO_CATEGORIES[0];

  const isExploded = isHovered || isExplodedManual;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;

    if (draggingRef.current) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setRotation((prev) => ({
        rx: Math.max(32, Math.min(72, prev.rx - dy * 0.32)),
        ry: Math.max(-18, Math.min(18, prev.ry + dx * 0.12)),
        rz: Math.max(-75, Math.min(15, prev.rz + dx * 0.38)),
      }));
      return;
    }

    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({
      rx: Number((54 - ny * 12).toFixed(2)),
      ry: Number((nx * 10).toFixed(2)),
      rz: Number((-34 + nx * 18).toFixed(2)),
    });
  };

  const handlePointerUpOrLeave = () => {
    draggingRef.current = false;
    setIsHovered(false);
    setRotation({ rx: 54, ry: 0, rz: -34 });
  };

  const handleSelectCat = (key: StudioCategoryKey) => {
    setActiveCat(key);
    onSelectCategory?.(key);
  };

  // Z-elevation offsets for the 3 exploded layers
  const layer2Z = isExploded ? 26 : 12;
  const layer3Z = isExploded ? 64 : 30;
  const calloutZ = isExploded ? 94 : 58;

  return (
    <div className="w-full max-w-full flex flex-col rounded-[24px] border border-slate-200/90 bg-gradient-to-b from-[#F2F4F8] to-[#E6EBF2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_-10px_rgba(15,23,42,0.08)] overflow-hidden select-none">
      {/* Studio Top Bar: Floating Callout Pill & Explode Toggle */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1 z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs min-w-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">
            {currentSpec.calloutTitle}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExplodedManual((prev) => !prev)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all active:scale-95 ${
            isExploded
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white/85 text-slate-600 border-slate-200/90 hover:text-slate-900 hover:bg-white'
          }`}
          title="Toggle exploded 3D layer inspection"
        >
          <Move3d className="w-3 h-3" />
          <span>{isExploded ? 'Exploded' : 'Explode Z'}</span>
        </button>
      </div>

      {/* Interactive 3D Isometric Viewport */}
      <div
        ref={stageRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerLeave={handlePointerUpOrLeave}
        className="relative w-full h-[260px] sm:h-[305px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ perspective: '1100px' }}
      >
        {/* Subtle Precision CAD Dot-Grid Studio Floor */}
        <div
          className="pointer-events-none absolute inset-0 opacity-65"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.28) 1.2px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Soft Studio Radial Daylight Highlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.75) 0%, rgba(230,235,242,0) 68%)',
          }}
        />

        {/* Root 3D Isometric Scene Assembly */}
        <div
          className="relative w-[220px] h-[168px] sm:w-[252px] sm:h-[192px]"
          style={{
            transform: `rotateX(${rotation.rx}deg) rotateY(${rotation.ry}deg) rotateZ(${rotation.rz}deg)`,
            transformStyle: 'preserve-3d',
            transition: draggingRef.current
              ? 'none'
              : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Studio Floor Ambient Contact Shadow (Drops deeper when exploded) */}
          <div
            className="absolute inset-0 rounded-[22px] bg-slate-900/20 blur-xl pointer-events-none transition-all duration-300"
            style={{
              transform: `translateZ(${isExploded ? -36 : -20}px) scale(${
                isExploded ? 1.06 : 0.98
              })`,
            }}
          />

          {/* ==============================================================
              LAYER 1: BASE SUBSTRATE (FR4 PCB SLAB WITH REAL 3D THICKNESS)
             ============================================================== */}
          <div
            className="absolute inset-0 rounded-[18px] transition-all duration-500"
            style={{
              background: currentSpec.substrateColor,
              border: `2px solid ${currentSpec.substrateBorder}`,
              transformStyle: 'preserve-3d',
              boxShadow:
                'inset 0 1px 2px rgba(255,255,255,0.25), 0 10px 24px rgba(15,23,42,0.32)',
            }}
          >
            {/* 3D Extruded PCB Front Wall (South Edge) */}
            <div
              className="absolute left-0 right-0 -bottom-[10px] h-[10px] rounded-b-[4px]"
              style={{
                background: 'linear-gradient(180deg, #0D2E22 0%, #05130E 100%)',
                backgroundColor: currentSpec.substrateSideColor,
                transform: 'rotateX(-90deg)',
                transformOrigin: 'top',
                borderBottom: '1px solid rgba(217, 169, 56, 0.45)',
              }}
            />

            {/* 3D Extruded PCB Right Wall (East Edge) */}
            <div
              className="absolute top-0 bottom-0 -right-[10px] w-[10px] rounded-r-[4px]"
              style={{
                backgroundColor: currentSpec.substrateSideColor,
                transform: 'rotateY(90deg)',
                transformOrigin: 'left',
                borderRight: '1px solid rgba(217, 169, 56, 0.45)',
              }}
            />

            {/* 4 Gold-Plated Corner Mounting Standoff Holes */}
            {[
              'top-2.5 left-2.5',
              'top-2.5 right-2.5',
              'bottom-2.5 left-2.5',
              'bottom-2.5 right-2.5',
            ].map((pos, idx) => (
              <div
                key={idx}
                className={`absolute ${pos} w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-[2.5px] shadow-inner`}
              >
                <div className="w-full h-full rounded-full bg-[#1E293B]" />
              </div>
            ))}

            {/* Precision Copper Etched Routing Traces SVG on Substrate */}
            <svg
              className="absolute inset-0 w-full h-full opacity-55 pointer-events-none"
              viewBox="0 0 252 192"
              fill="none"
            >
              {/* Outer Ground Bus Ring */}
              <rect
                x="16"
                y="16"
                width="220"
                height="160"
                rx="10"
                stroke={currentSpec.traceColor}
                strokeWidth="1"
                strokeDasharray="6 4"
                strokeOpacity="0.45"
              />
              {/* Precision 45-degree Copper Signal Routing */}
              <path
                d="M28 52 H68 L88 72 H164 L184 52 H224"
                stroke={currentSpec.traceColor}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M28 140 H72 L94 118 H158 L180 140 H224"
                stroke={currentSpec.traceColor}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M60 26 V64 L84 88 V164"
                stroke="#FBBF24"
                strokeWidth="1.3"
                strokeOpacity="0.7"
              />
              <path
                d="M192 26 V64 L168 88 V164"
                stroke="#FBBF24"
                strokeWidth="1.3"
                strokeOpacity="0.7"
              />
              {/* Gold Test Pads (TP1 - TP6) */}
              {[42, 74, 106, 146, 178, 210].map((cx, i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy="166"
                  r="2.8"
                  fill="#F59E0B"
                  stroke="#FEF3C7"
                  strokeWidth="0.8"
                />
              ))}
            </svg>

            {/* Silkscreen Engineering Legend on Substrate */}
            <div className="absolute bottom-2.5 left-8 text-[8px] font-mono tracking-wider text-white/60 uppercase">
              SH-REV4.2 • FR4-TG170
            </div>
          </div>

          {/* Vertical Z-Axis Optical Alignment Guide Lines (visible when exploded) */}
          <div
            className="absolute inset-8 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isExploded ? 0.55 : 0,
              transform: 'translateZ(18px)',
            }}
          >
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          </div>

          {/* ==============================================================
              LAYER 2: POWER & PASSIVE 3D BLOCKS (MORPHS BY CATEGORY)
             ============================================================== */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-500 ease-out"
            style={{
              transform: `translateZ(${layer2Z}px)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {activeCat === 'ICS_MCUS' && (
              <>
                {/* Two 3D Cylindrical Electrolytic Capacitors (Brushed Silver Top Vents) */}
                {[
                  { top: '24px', left: '24px', label: '470µF' },
                  { top: '66px', left: '24px', label: '220µF' },
                ].map((cap, idx) => (
                  <div
                    key={idx}
                    className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-950 border border-slate-500 shadow-lg flex items-center justify-center"
                    style={{
                      top: cap.top,
                      left: cap.left,
                      transform: 'translateZ(8px)',
                    }}
                  >
                    {/* Brushed Aluminum K-Vent Top */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-300 via-white to-slate-400 border border-slate-400 flex items-center justify-center relative">
                      <div className="w-4 h-[1px] bg-slate-500/70 rotate-45 absolute" />
                      <div className="w-4 h-[1px] bg-slate-500/70 -rotate-45 absolute" />
                    </div>
                  </div>
                ))}

                {/* 16.000 MHz Brushed Steel Crystal Oscillator Can */}
                <div
                  className="absolute bottom-6 left-7 w-14 h-6 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-300 border border-slate-400 shadow-md flex items-center justify-center"
                  style={{ transform: 'translateZ(6px)' }}
                >
                  <span className="font-mono text-[7px] font-bold text-slate-700 tracking-tight">
                    16.0MHz
                  </span>
                </div>

                {/* Anodized Finned Aluminum Heatsink Block (Right Side) */}
                <div
                  className="absolute top-6 right-5 w-11 h-28 rounded-lg bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 border border-slate-400 shadow-lg p-1 flex flex-col justify-between"
                  style={{ transform: 'translateZ(10px)' }}
                >
                  {[0, 1, 2, 3, 4, 5].map((fin) => (
                    <div
                      key={fin}
                      className="w-full h-2 rounded-xs bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 shadow-2xs"
                    />
                  ))}
                </div>

                {/* Copper Toroidal Inductor Ring */}
                <div
                  className="absolute bottom-6 right-16 w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 via-orange-500 to-amber-800 border-2 border-amber-300/80 shadow-md flex items-center justify-center"
                  style={{ transform: 'translateZ(7px)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#09221A] border border-amber-400/60" />
                </div>
              </>
            )}

            {activeCat === 'APPLIANCE_PCBS' && (
              <>
                {/* 3 Extruded Omron-Style Blue Industrial Relay Blocks */}
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="absolute w-12 h-9 rounded-md bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 border border-sky-300/70 shadow-lg p-1.5 flex flex-col justify-between"
                    style={{
                      top: `${22 + idx * 42}px`,
                      left: '22px',
                      transform: 'translateZ(10px)',
                    }}
                  >
                    <div className="font-mono text-[6.5px] font-bold text-white leading-none">
                      G5Q-14
                    </div>
                    <div className="font-mono text-[6px] text-sky-100 leading-none">
                      12VDC 10A
                    </div>
                  </div>
                ))}

                {/* Heavy Multi-Fin Extruded Aluminum Inverter Heatsink */}
                <div
                  className="absolute top-5 right-5 w-14 h-36 rounded-lg bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-slate-400 shadow-xl p-1.5 flex flex-row justify-between"
                  style={{ transform: 'translateZ(14px)' }}
                >
                  {[0, 1, 2, 3, 4].map((fin) => (
                    <div
                      key={fin}
                      className="h-full w-1.5 rounded-xs bg-gradient-to-b from-slate-500 via-slate-300 to-slate-600"
                    />
                  ))}
                </div>
              </>
            )}

            {activeCat === 'LI_ION_CELLS' && (
              <>
                {/* 4 Parallel Cylindrical 18650 Lithium-Ion Cells with Nickel Spot-Welded Busbars */}
                <div
                  className="absolute top-5 left-5 right-5 h-32 grid grid-cols-4 gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-700 shadow-xl"
                  style={{ transform: 'translateZ(10px)' }}
                >
                  {[0, 1, 2, 3].map((cellIdx) => (
                    <div
                      key={cellIdx}
                      className="relative h-full rounded-lg bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-800 border border-emerald-300/50 shadow-inner flex flex-col items-center justify-between py-1.5"
                    >
                      {/* Brushed Nickel Positive Terminal Cap */}
                      <div className="w-6 h-2 rounded-xs bg-gradient-to-r from-slate-200 via-white to-slate-300 border border-slate-400 shadow-2xs" />
                      <div className="font-mono text-[7px] font-bold text-white tracking-tighter rotate-90 whitespace-nowrap">
                        18650 • 3.7V
                      </div>
                      <div className="w-6 h-1.5 rounded-xs bg-slate-300" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeCat === 'SMPS_POWER' && (
              <>
                {/* Dual Tall 400V Primary Bulk Filter Capacitors */}
                {[0, 1].map((capIdx) => (
                  <div
                    key={capIdx}
                    className="absolute w-11 h-11 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black border-2 border-amber-500/60 shadow-xl flex items-center justify-center"
                    style={{
                      top: `${22 + capIdx * 52}px`,
                      left: '22px',
                      transform: 'translateZ(14px)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 via-white to-slate-400 border border-slate-500 flex items-center justify-center relative">
                      <div className="w-5 h-[1px] bg-slate-600 rotate-45 absolute" />
                      <div className="w-5 h-[1px] bg-slate-600 -rotate-45 absolute" />
                      <span className="font-mono text-[6px] font-bold text-slate-900 z-10 bg-white/80 px-0.5 rounded">
                        400V
                      </span>
                    </div>
                  </div>
                ))}

                {/* High-Frequency Yellow Isolation Transformer Block */}
                <div
                  className="absolute bottom-5 left-20 w-16 h-12 rounded-lg bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border border-amber-600 shadow-lg flex flex-col items-center justify-center"
                  style={{ transform: 'translateZ(12px)' }}
                >
                  <div className="w-12 h-3 bg-slate-900 rounded-xs mb-0.5" />
                  <span className="font-mono text-[7px] font-bold text-slate-950">
                    EE25-SMPS
                  </span>
                </div>

                {/* Large Copper-Wound Toroidal Output Inductor */}
                <div
                  className="absolute top-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 via-amber-600 to-amber-900 border-2 border-amber-300 shadow-xl flex items-center justify-center"
                  style={{ transform: 'translateZ(14px)' }}
                >
                  <div className="w-6 h-6 rounded-full bg-[#0A1F18] border border-amber-400" />
                </div>
              </>
            )}
          </div>

          {/* ==============================================================
              LAYER 3: LEVITATING SILICON IC / PRIMARY CORE PACKAGE
             ============================================================== */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-out"
            style={{
              transform: `translateZ(${layer3Z}px)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Dynamic Shadow Cast by Levitating IC onto PCB Socket */}
            <div
              className="absolute w-24 h-24 rounded-2xl bg-slate-950/35 blur-md transition-all duration-500"
              style={{
                transform: `translateZ(${-layer3Z + 6}px) scale(${
                  isExploded ? 0.85 : 0.96
                })`,
              }}
            />

            {/* Precision QFP-64 / Module Silicon Package */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Top & Bottom Gull-Wing Metallic Pins (12 pins each side) */}
              <div className="absolute -top-2 left-3 right-3 flex justify-between">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-2.5 rounded-t-xs bg-gradient-to-b from-amber-200 via-slate-200 to-slate-400 shadow-2xs"
                  />
                ))}
              </div>
              <div className="absolute -bottom-2 left-3 right-3 flex justify-between">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-2.5 rounded-b-xs bg-gradient-to-t from-amber-200 via-slate-200 to-slate-400 shadow-2xs"
                  />
                ))}
              </div>
              {/* Left & Right Gull-Wing Metallic Pins */}
              <div className="absolute -left-2 top-3 bottom-3 flex flex-col justify-between">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-2.5 rounded-l-xs bg-gradient-to-r from-amber-200 via-slate-200 to-slate-400 shadow-2xs"
                  />
                ))}
              </div>
              <div className="absolute -right-2 top-3 bottom-3 flex flex-col justify-between">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-2.5 rounded-r-xs bg-gradient-to-l from-amber-200 via-slate-200 to-slate-400 shadow-2xs"
                  />
                ))}
              </div>

              {/* Matte Dark Charcoal Epoxy Silicon Die Body */}
              <div
                className="w-full h-full rounded-xl bg-gradient-to-br from-[#272B33] via-[#181B20] to-[#0E1014] border border-slate-500/80 p-2.5 flex flex-col justify-between shadow-[0_14px_28px_rgba(15,23,42,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                <div className="flex items-center justify-between">
                  {/* Pin-1 Laser Dimple */}
                  <div className="w-2 h-2 rounded-full bg-emerald-400/90 shadow-[0_0_6px_#10B981]" />
                  <span className="font-mono text-[7px] text-slate-400 tracking-widest">
                    {activeCat === 'ICS_MCUS'
                      ? 'QFP-64'
                      : activeCat === 'APPLIANCE_PCBS'
                      ? 'IGBT-IPM'
                      : activeCat === 'LI_ION_CELLS'
                      ? 'BMS-40A'
                      : 'PWM-IC'}
                  </span>
                </div>

                {/* Laser-Etched Chip Marking */}
                <div className="text-center my-auto">
                  <div className="font-mono text-[10px] font-bold text-white tracking-tight leading-tight">
                    {activeCat === 'ICS_MCUS'
                      ? 'STM32F407'
                      : activeCat === 'APPLIANCE_PCBS'
                      ? 'STK621-068'
                      : activeCat === 'LI_ION_CELLS'
                      ? 'DW01-4S40A'
                      : 'UCC28740'}
                  </div>
                  <div className="font-mono text-[7.5px] text-emerald-400 font-medium mt-0.5">
                    {activeCat === 'ICS_MCUS'
                      ? 'ATmega328P'
                      : activeCat === 'APPLIANCE_PCBS'
                      ? '3-PHASE IPM'
                      : activeCat === 'LI_ION_CELLS'
                      ? 'BALANCED'
                      : '24V 10A REG'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-400">
                  <span>ARM®</span>
                  <span className="text-amber-300">QC PASS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Studio Spec Pill in 3D Space (Elevates on Hover/Drag) */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900/92 text-white text-[9.5px] font-medium shadow-lg border border-white/15 pointer-events-none transition-all duration-300"
            style={{
              transform: `translate(-50%, 0) translateZ(${calloutZ}px)`,
            }}
          >
            <span className="text-emerald-400 font-semibold mr-1">●</span>
            <span>{currentSpec.calloutSubtitle}</span>
          </div>
        </div>

        {/* Subtle Bottom-Right Studio Interaction Hint */}
        <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-slate-500 font-medium bg-white/75 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200/80">
          Drag to rotate • Hover to explode layers
        </div>
      </div>

      {/* Interactive Category Morphing Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2.5 bg-white/90 border-t border-slate-200/80">
        {STUDIO_CATEGORIES.map((cat) => {
          const isSelected = cat.key === activeCat;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleSelectCat(cat.key)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              {cat.key === 'ICS_MCUS' ? (
                <Cpu className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : cat.key === 'APPLIANCE_PCBS' ? (
                <Layers className="w-3.5 h-3.5 shrink-0 text-sky-500" />
              ) : cat.key === 'LI_ION_CELLS' ? (
                <BatteryCharging className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              )}
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Real3DHardwareStage;

