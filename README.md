# Isla

A single-scene, browser-based [three.js](https://threejs.org) island you can reach into: drag through the sand and it deforms, waves roll onto the shore and react to what you've dug, coconut trees and hut thatch answer a shared wind. No login, no tutorial, no win condition — the whole pitch is a beach that responds and feels alive at rest.

**Live:** [3d-island-lemon.vercel.app](https://3d-island-lemon.vercel.app)

## Features

- **Sand you can shape** — left-click/one-finger drag deforms the beach in real time; footprints soften back to flat over about a minute.
- **An ocean that notices** — layered Gerstner waves with a Fresnel-driven color blend, plus a wet-sand/foam shoreline that reacts to whatever you've dug or piled near the waterline.
- **A living grove** — coconut trees and a thatched beach hut sway in a shared wind system, each with its own phase so nothing moves in lockstep.
- **Adaptive quality** — auto-detects device capability on load (mesh density, pixel ratio, bloom/SSAO) with a manual override.
- **No installs, no accounts** — open the link and it's already running.

## Tech stack

Vite + TypeScript + three.js, with hand-written GLSL for the sand/water/wind shaders. Trees and the hut are modeled in Blender (scripted, headless — see [`tools/blender`](tools/blender)) and exported as Draco-compressed glTF. No backend: every visitor's island is self-contained client state on a static CDN host (Vercel).

Full rationale for these choices lives in [`PLANNING.md`](PLANNING.md).

## Getting started

```bash
npm install
npm run dev
```

Opens the dev server at `http://localhost:5173`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-checks, then builds the production bundle to `dist/` |
| `npm run preview` | Serves the production build locally, for testing what actually ships |
| `npm run lint` | ESLint |
| `npm test` | Runs the Vitest suite |

### Regenerating the 3D models

The coconut tree and beach hut are procedurally scripted in Blender rather than hand-modeled, then exported as Draco-compressed `.glb`. Requires a local [Blender](https://www.blender.org) install:

```bash
blender --background --python tools/blender/build_coconut_tree.py -- src/assets/models/coconut-tree.glb
blender --background --python tools/blender/build_beach_hut.py -- src/assets/models/beach-hut.glb
```

## Project structure

```
src/
  main.ts          entry point, render loop, pointer/camera wiring
  scene/            scene assembly — Island, Camera, Sky, CoconutTree, Hut
  systems/          Wind, Sand, Ocean, Audio, DeviceProfile — the actual product
  shaders/          hand-written GLSL for sand, water, foliage sway
  ui/               mute/quality controls, the idle "drag the sand" hint
  quality/          device capability probe → quality tier
tools/blender/      headless scripts that generate the glTF models
```

## Quality gates

Every commit runs through a Husky `pre-commit` hook: dependency-tree check → lint → typecheck + build → `npm audit` → tests. Commit messages are enforced as [Conventional Commits](https://www.conventionalcommits.org) via commitlint. Nothing lands without passing all of it.

## Project docs

- [`isla-prd.html`](isla-prd.html) — the product spec (vision, features, success metrics)
- [`PLANNING.md`](PLANNING.md) — architecture, stack rationale, required tools
- [`TASKS.md`](TASKS.md) — milestone-by-milestone task list and status
- [`CLAUDE.md`](CLAUDE.md) — working conventions and a running session log
