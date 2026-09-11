# Isla

A single-scene, browser-based three.js island the visitor can reach into: sand deforms under cursor/touch, waves roll onto the shore, coconut trees and hut thatch answer a shared wind system. No login, no tutorial, no win condition — the whole pitch is a beach that responds and feels alive at rest.

Full spec: [`isla-prd.html`](isla-prd.html) (also published as an artifact — ask before assuming it's stale; this file summarizes it for day-to-day work). When a decision here and the PRD disagree, update both in the same change rather than letting them drift.

**Status:** pre-scaffold. No source tree exists yet — the sections below describe what to build, not what's there.

## Session workflow

- Read [`PLANNING.md`](PLANNING.md) at the start of every new conversation — it has the architecture, stack, and required tools this file only summarizes.
- Check [`TASKS.md`](TASKS.md) before starting work. Do the next open task in the current milestone unless told otherwise; don't jump ahead into a later milestone or into Backlog.
- Mark a task done in `TASKS.md` immediately after finishing it — not batched at the end of a session.
- When you discover a task that isn't already listed (a bug, a missing step, a follow-up), add it to `TASKS.md` under the right milestone (or Backlog, if it's post-MVP) as soon as you find it.

## Stack

- **three.js** on **Vite + TypeScript**. No backend for MVP — each session is a self-contained island, so a static CDN host is sufficient.
- Models: glTF, **Draco**-compressed geometry, **KTX2/Basis** textures.
- Custom GLSL for water and sand; don't reach for a physics/fluid library — both are handled with the techniques below, and pulling in a heavier dependency works against the load-time budget.

## Core systems

These four are the actual product; everything else is presentation around them.

- **Sand deformation** — a GPGPU-style ping-pong render target. Pointer drags stamp a brush into a height texture each frame; that texture drives vertex displacement + recomputed normals on the beach mesh; a slow decay pass blends it back toward flat, which is also what makes footprints erode. Deformation and erosion are the same mechanism — don't build them as separate systems.
- **Ocean** — a sum of Gerstner waves computed per-vertex, with an in-shader normal map and a Fresnel-driven reflect/refract blend. The shoreline needs a wet-sand darkening band and an advancing/retreating foam line where water meets the height texture above.
- **Wind** — one global uniform (direction, strength, gust noise) sampled in vertex shaders. Trees, hut cloth, and loose-sand particles all read from it with a per-instance phase offset so nothing moves in lockstep. Treat this as the single source of truth for ambient motion — if a new element needs to sway, wire it to this uniform rather than giving it its own animation clock.
- **Camera** — damped orbit/pan, clamped so it can't leave the island framed or clip through terrain.

## Scope discipline

MVP is the eight P0 features in the PRD (§4): sand interaction, ocean/shoreline, coconut trees, beach huts, wind system, sky/light, camera, ambient audio. Don't pull forward anything from §5 (time-of-day, weather, multiplayer, customization, screenshots, ambient wildlife) without an explicit ask — they're deferred for real scope reasons, not forgotten.

Hard non-goals, don't scaffold for these even speculatively: accounts/auth, scoring or objectives, a terrain/object editor, monetization.

## Performance budget

- 60fps sustained on a 2022+ laptop, 30fps+ on a mid-range phone.
- Time-to-interactive: <3s desktop broadband, <5s mobile.
- Adaptive quality is required, not optional: probe device capability on load and scale shadow resolution, wave-mesh subdivision, and pixel ratio accordingly, with a manual override in the UI. When in doubt about a new effect's cost, gate it behind the quality tier rather than shipping it flat-on for everyone.
- Post-processing stays light by default (bloom on water highlights, ACES tone mapping); reserve anything heavier (e.g. SSAO) for the highest tier only.

## Interaction & UX rules

- No persistent UI chrome beyond a mute toggle and a quality toggle, both small and corner-docked.
- Nothing snaps — camera, sand relaxation, and wind gusts all ease on damped curves.
- Teach by fading a hint in after idle time and permanently dismissing it on first interaction — never a modal or tutorial overlay.
- Touch and mouse drive the same sand/camera interactions; simplify rendering on weaker devices rather than removing what a visitor can do.

## Working conventions

- This is a from-scratch build: when the source tree doesn't yet reflect a convention you need (folder layout, shader organization, asset naming), make a reasonable choice, apply it consistently, and note it here rather than improvising differently each session.
- Prefer extending the four core systems above over adding parallel ones — a new visual element should almost always hook into sand, water, or wind rather than inventing its own state.

## Session log

Newest first. Add an entry here at the end of a session that changes project state (code, docs, or decisions) — a line or two is enough.

- **2026-09-10** — Built Milestone 1: `WindSystem.ts` (shared direction/strength/time uniforms on a gust envelope), `SandSystem.ts` (`GPUComputationRenderer`-backed height field — one pass does both brush-stamp and decay — driving `sand.vert.glsl` displacement + recomputed normals) with `SandParticles.ts` for the fast-drag kick-up, `OceanSystem.ts` (three summed Gerstner waves, Fresnel color blend, sun specular) with a shoreline band in `water.frag.glsl` that samples the sand system's own height texture so digging near the waterline actually floods it, and `CoconutTree.ts` (procedural — no modeling pipeline exists yet, flagged as a Milestone 2 follow-up) swaying via `foliage.vert.glsl`. Repointed `Island.ts` to just place the grove, since sand/ocean now need a renderer and live in `main.ts`. Split camera input so left-click/one-finger shapes sand and right-click/two-finger orbits, swapped the deprecated `THREE.Clock` for `THREE.Timer`. All five commits passed the full pre-commit gate; verified in-browser (drag visibly deforms and fades over ~8s, waves animate, trees sway independently, clean console on a stable viewport). Milestone 1 is complete — waiting for the user's go-ahead before Milestone 2.

- **2026-09-09** — Connected the project to `github.com/AiraDeCastro/3d-island` (force-pushed over its old, unrelated 2024 Vite-template history, with explicit go-ahead first). Added commit-quality tooling: ESLint flat config, Vitest, Husky `pre-commit` (dependency-tree check → lint → typecheck+build → `npm audit` → tests) and `commit-msg` (commitlint, Conventional Commits) hooks — every commit below passed all of it. Finished the rest of Milestone 0: `Island.ts` (placeholder sand + ocean discs), `Sky.ts` (gradient dome + positioned sun light, custom GLSL), `Camera.ts` (damped, clamped `OrbitControls`), and a proper `requestAnimationFrame` loop in `main.ts` through an `EffectComposer` with ACES tone mapping; replaced and removed the earlier placeholder-box `createScene.ts`. Verified in-browser (renders correctly, orbit drag works, no console errors) before each commit. The user connected the repo to Vercel themselves (account creation isn't something this session can do); the live preview at [3d-island-lemon.vercel.app](https://3d-island-lemon.vercel.app) was verified to match the local build with no console errors. **Milestone 0 is complete.** Waiting for the user's go-ahead before starting Milestone 1.

- **2026-09-09** — Wrote the PRD (`isla-prd.html`) and the three planning docs (`CLAUDE.md`, `PLANNING.md`, `TASKS.md`). Scaffolded the Vite + TypeScript project (`npm create vite`, vanilla-ts template) in place of the template demo content, installed `three` + `@types/three`, and wired a minimal `main.ts` that renders a lit box to a full-bleed canvas — verified in-browser with no console errors. This closes the first Milestone 0 task; the project has no other code yet, so `src/` still has the default `main.ts`/`style.css` only, not the `scene/`/`systems/`/`shaders/` layout proposed in `PLANNING.md` (that's the next task).
