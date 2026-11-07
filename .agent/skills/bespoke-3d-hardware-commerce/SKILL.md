---
name: bespoke-3d-hardware-commerce
description: Enforces non-AI-looking, spatial 3D hardware engineering UI (Spline/Three.js/CSS-3D perspective), strict financial/escrow state invariants, and zero-bug TypeScript architecture.
---

# Bespoke 3D Hardware Commerce Architecture Skill

## 1. Anti-AI Aesthetic & 3D Spatial Engineering Rules
- **NEVER use generic AI clichés:** Ban flat purple/indigo gradients, generic Tailwind placeholder cards, raw string icon names, or standard SaaS hero blocks.
- **Tactile 3D PCB & Hardware Depth:**
  - Every product card and modal must use true 3D perspective (`perspective: 1200px`, `transform-style: preserve-3d`), dynamic cursor-tracked tilt (`rotateX`, `rotateY`), and multi-layered specular lighting (`radial-gradient` following pointer coordinates).
  - Include an interactive **3D Hardware Hero Stage** (using HTML5 Canvas / Three.js / WebGL 3D PCB & IC chip visualizer with interactive rotation, gold-plated pins, and glowing circuit traces).
  - Surfaces must feel like precision anodized aluminum, matte FR4 solder-mask obsidian (`#07090E`), brushed titanium borders (`rgba(255,255,255,0.12)`), and electroluminescent copper/emerald traces (`#00F5A0` and `#FFB800`).
- **Typography:** Pair geometric display headers (`Space Grotesk` / `Inter Tight`) with technical engineering telemetry in `JetBrains Mono` (`tabular-nums`).

## 2. Financial & State Invariants (Zero-Bug Mandate)
- **Single Source of Truth for Pricing (`src/config/pricingEngine.ts`):**
  - Delivery rates, commission percentages, and bargain discounts must NEVER be hardcoded inside UI components. All components (`InspectionCheckoutModal`, `MarketplacePortal`, `OrdersTrackerPortal`, `useHarvestStore`) MUST call a single pure calculation function `calculateOrderBreakdown()`.
- **Strict Nullish Coalescing:**
  - NEVER use `value || fallback` for numeric currency fields where `0` is valid (such as `platformCommissionInr ?? 0`). Always use `??`.
- **Scoped & Single-Use Bargains:**
  - Every bargain offer MUST record `targetType: 'BOARD' | 'COMPONENT'`, `targetId`, and `buyerId`. An accepted bargain can only be applied by that exact `buyerId` on that exact `targetId`, and transitions to `'REDEEMED'` immediately upon `placeOrder()`.

