# Isla — Planning

Companion to [`CLAUDE.md`](CLAUDE.md) (day-to-day working rules) and [`isla-prd.html`](isla-prd.html) (full product spec). This file covers the shape of the build: why it exists, how it's structured, what it's built with, and what a contributor needs installed to work on it.

## Vision

Isla is a single-scene, browser-based three.js island a visitor can reach into: drag through the sand and it displaces, with footprints softening back to smooth over roughly a minute; waves roll onto the shore on their own rhythm, darkening the sand and leaving a foam line; coconut trees and hut thatch answer a shared wind. Nothing needs to be clicked to start — the island is already alive on load, and touching it is the whole point. There's no score, no login, no tutorial. The bar for success is a first-time visitor touching the sand within ten seconds of arriving, and staying because the scene keeps doing something on its own.

## Architecture

### Shape of the app

Isla is one WebGL canvas and no routing — a render loop, not a page tree. There's no backend for MVP: every visitor's island is local, self-contained state, which is what keeps hosting to a static CDN.

```
Pointer / touch input
        │
        ▼
  raycast onto beach plane
        │
        ▼
┌───────────────────┐      ┌──────────────────────┐
│   Sand System      │◄─────│   Wind System        │
│  (heightmap RT,     │      │  (direction, strength,│
│   brush + decay)    │      │   gust noise)         │
└─────────┬──────────┘      └──────┬───────┬────────┘
          │                         │       │
          ▼                         ▼       ▼
   beach mesh (vertex          foliage /  ocean ripple
   displacement +              cloth sway  detail
   recomputed normals)
          │                         │       │
          └───────────┬─────────────┴───────┘
                       ▼
                 three.js scene
                       │
                       ▼
              EffectComposer (bloom, ACES tonemap)
                       │
                       ▼
                    <canvas>
```

The **wind system** is the one shared clock: trees, hut cloth, and ocean ripple detail all sample the same uniform with a per-instance phase offset, rather than each running its own animation. The **sand system** is the one piece of persistent, mutable scene state — a render-target height texture that a brush pass stamps into and a decay pass relaxes back toward flat every frame. Everything else in the scene (ocean base motion, sky, camera) is state-free per frame: computed fresh from time and camera position, nothing to save or reset.

### Render loop order (per frame)

1. Update wind uniform (time-driven direction/strength + gust noise).
2. Sand: apply pointer brush stamp (if dragging) → run decay pass on the height render target.
3. Ocean: advance Gerstner wave time uniform; sample sand height texture along the shoreline for the wet-sand/foam band.
4. Foliage & cloth: sample wind uniform in vertex shaders (no CPU-side update needed).
5. Update damped camera position/target.
6. Render scene → EffectComposer (bloom pass, ACES tone mapping) → canvas.

### Proposed source layout

No source tree exists yet; this is the layout to start from rather than something already in place.

```
src/
  main.ts                 entry point, render loop
  scene/
    Island.ts              scene assembly (mesh placement, lighting rig)
    Camera.ts               damped orbit/pan controller
    Sky.ts                   procedural sky + sun positioning
  systems/
    SandSystem.ts            heightmap render target, brush + decay passes
    OceanSystem.ts            Gerstner wave mesh, shoreline sampling
    WindSystem.ts             shared uniform, gust noise
    AudioSystem.ts            looping surf/wind bed, mute state
  shaders/
    sand.vert.glsl / sand.frag.glsl
    water.vert.glsl / water.frag.glsl
    foliage.vert.glsl
  ui/
    HintOverlay.ts            idle-fade "touch the sand" hint
    Controls.ts                mute + quality toggle (corner-docked)
  quality/
    DeviceProfile.ts          capability probe → quality tier selection
assets/
  models/                    glTF + Draco
  textures/                  KTX2/Basis
  audio/
public/
```

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite + TypeScript | Fast dev server, native ES modules, minimal config overhead for a single-page app. |
| Rendering | three.js, WebGL2 | Scene graph, loaders, and `EffectComposer` cover everything except the custom shaders. |
| Shaders | Raw GLSL via `ShaderMaterial` | Sand and water are bespoke effects; a shader-graph tool would add indirection without saving time at this scope. |
| Post-processing | three.js `EffectComposer` (bloom + ACES tone mapping) | Kept deliberately light per the performance budget in `CLAUDE.md`; SSAO reserved for the top quality tier only. |
| Models | glTF 2.0 + Draco compression | Standard three.js loader path; Draco cuts geometry payload for trees/huts. |
| Textures | KTX2 / Basis Universal | GPU-compressed textures load faster and cost less VRAM than PNG/JPEG at runtime. |
| Audio | Web Audio API (directly, or Howler.js if the fade/loop handling gets fiddly) | Looping ambient beds with a mute toggle; no need for a mixing framework beyond this. |
| UI (mute/quality toggles, hint) | Plain DOM + CSS | Two small controls and a hint don't justify a UI framework's bundle cost on top of three.js. |
| Hosting | Static CDN host (Vercel/Netlify-class) | No backend for MVP — each island is self-contained client state. |
| Analytics | Lightweight, privacy-respecting (e.g. Plausible) | Matches the PRD's "no data collection beyond standard anonymous analytics." |

## Required tools

What a contributor needs installed to build, author assets for, and debug this project.

**Core dev environment**
- Node.js LTS (20.x) + npm or pnpm
- Git
- A GLSL-aware editor setup (e.g. VS Code + a GLSL syntax/lint extension) — most of the interesting bugs live in shader code

**Asset pipeline**
- Blender (or equivalent) for modeling coconut trees and huts, exporting to glTF
- [`gltf-transform`](https://gltf-transform.dev) CLI — Draco geometry compression, texture optimization
- KTX-Software (`toktx`) — KTX2/Basis texture compression
- Audacity (or equivalent) — trimming and loop-cleaning the ambient surf/wind audio beds

**Testing & profiling**
- Chrome or Edge with DevTools (Performance + Memory panels) for frame-time profiling
- Spector.js browser extension — inspecting individual WebGL draw calls when a shader misbehaves
- Lighthouse — checking the `<3s`/`<5s` time-to-interactive budget from `CLAUDE.md`
- Safari (desktop + iOS) and a real mid-range Android device — the PRD flags WebGL inconsistencies and the mobile performance floor as the two biggest risks, so both need hands-on testing, not just emulation
