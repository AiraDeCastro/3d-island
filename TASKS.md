# Isla — Tasks

Milestones match the phased plan in [`isla-prd.html`](isla-prd.html#plan); file/system names match the layout in [`PLANNING.md`](PLANNING.md). Work top to bottom — later milestones assume earlier ones are done, not just started.

## Milestone 0 — Prototype (2–3 wks)

Goal: an island on screen, nothing interactive yet.

- [x] Scaffold Vite + TypeScript project, add three.js
- [x] Set up `src/` layout (`scene/`, `systems/`, `shaders/`, `ui/`, `quality/`) per PLANNING.md — `scene/` and `shaders/` exist now; `systems/`, `ui/`, `quality/` get created when Milestones 1–2 actually add content to them
- [x] Add `main.ts` render loop with delta-time clock
- [x] Build placeholder island terrain mesh (static, no deformation)
- [x] Add flat ocean plane (no wave shader yet)
- [x] Implement `Camera.ts` — damped orbit/pan, clamped to keep the island framed
- [x] Implement `Sky.ts` — procedural sky + positioned sun/directional light
- [x] Set up `EffectComposer` with ACES tone mapping
- [x] Deploy an early build to a preview URL for visual sign-off — live at [3d-island-lemon.vercel.app](https://3d-island-lemon.vercel.app), redeploys automatically on every push to `main`

## Milestone 1 — Core interactivity (3–4 wks)

Goal: the three systems that make Isla *Isla* — sand, water, wind.

- [x] Implement `WindSystem.ts` — shared uniform (direction, strength, gust noise)
- [x] Implement `SandSystem.ts` — height render target with brush-stamp and decay passes
- [x] Write `sand.vert`/`sand.frag` — vertex displacement + recomputed normals from the height texture
- [x] Wire pointer/touch raycast onto the beach plane to drive the sand brush — left-click/one-finger; camera orbit moved to right-click/two-finger so the two gestures don't compete
- [x] Add sand particle kick-up on fast drags
- [x] Implement `OceanSystem.ts` and `water.vert`/`water.frag` — summed Gerstner waves, Fresnel reflect/refract
- [x] Add shoreline interaction — wet-sand darkening band and foam line sampling the sand height texture
- [x] Source/model coconut trees and place in scene — **built procedurally, not glTF/Draco**: no modeling pipeline (Blender, gltf-transform) is wired up yet, so `CoconutTree.ts` generates trunk/fronds/coconuts in code as a placeholder. See the new Milestone 2 task below to revisit this.
- [x] Write `foliage.vert` — wind-driven sway with per-instance phase offset

## Milestone 2 — Polish (2–3 wks)

Goal: the scene feels inhabited and runs everywhere it needs to.

- [x] Set up a real modeling pipeline (Blender → glTF → Draco) and replace the procedural `CoconutTree.ts` with authored, compressed tree assets — `tools/blender/build_coconut_tree.py`, headless, Draco baked in by Blender's own exporter (no separate `gltf-transform` step needed)
- [x] Source/model 1–2 beach huts (thatched roof) with one cloth element each (curtain or hammock) — `tools/blender/build_beach_hut.py`, a doorway curtain
- [x] Wire hut cloth to the `WindSystem` uniform — via `applyWindSway.ts`, the same helper the tree fronds use
- [x] Add warm interior hut glow for dusk lighting — a small warm `PointLight` added in `Hut.ts`
- [x] Implement `AudioSystem.ts` — looping surf/wind bed with fade in/out — synthesized via Web Audio (filtered noise), not audio files; wind volume rides the shared `WindSystem` gust envelope
- [x] Build `Controls.ts` — corner-docked mute toggle and quality toggle
- [x] Implement `DeviceProfile.ts` — capability probe driving wave-mesh density and pixel ratio (no shadows are cast anywhere yet, so there's no shadow resolution to gate)
- [x] Build `HintOverlay.ts` — idle-fade "touch the sand" hint, dismissed permanently on first interaction
- [x] Add bloom on water highlights; gate SSAO to the top quality tier only
- [x] Compress assets — Draco geometry (done, via Blender's own exporter). KTX2 textures and audio-file trimming don't apply: the project has no raster textures anywhere (materials are flat/vertex-colored) and no audio files (ambience is synthesized, not sampled) — revisit only if either of those stops being true
- [ ] Mobile pass on a real mid-range Android device — touch parity, adaptive quality behavior. **Partially validated only**: the browser tool's mobile viewport/touch emulation (375×812, coarse-pointer) shows the layout adapting correctly, `DeviceProfile` correctly auto-selecting the low tier, and touch-drag registering (dismissed the hint) — but that's emulation, not a real device, and I don't have physical hardware to test against. Leaving this open until someone can check on an actual mid-range Android phone.

## Milestone 3 — Launch (1–2 wks)

Goal: shipped, measured, stable.

- [ ] Cross-browser QA — Chrome, Firefox, desktop Safari, mobile Safari, mobile Chrome
- [ ] Profile frame time (Spector.js / DevTools); fix hot spots against the 60fps desktop / 30fps mobile targets
- [ ] Run Lighthouse; confirm <3s desktop / <5s mobile time-to-interactive — main bundle is ~700KB minified as of Milestone 2 (three.js + postprocessing/loader addons); consider code-splitting (e.g. lazy-load `SSAOPass` only on the high quality tier) if this budget is tight
- [ ] Wire lightweight, privacy-respecting analytics (e.g. Plausible)
- [ ] Check against PRD success metrics (§8) and the UX bar — touch within 10s of arrival
- [ ] Deploy to production static host; verify CDN asset delivery
- [ ] Confirm zero console errors/warnings across target browsers

## Backlog (post-MVP — do not start without an explicit ask)

Tracked here so they don't get pulled forward by accident; full rationale in the PRD (§5).

- [ ] Time-of-day lighting cycle
- [ ] Weather (rain, squalls)
- [ ] Shared/multiplayer island
- [ ] Sand tint, hut style, tree density customization
- [ ] Screenshot / share card
- [ ] Ambient wildlife (crabs, gulls, fish)
