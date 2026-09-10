# Isla — Tasks

Milestones match the phased plan in [`isla-prd.html`](isla-prd.html#plan); file/system names match the layout in [`PLANNING.md`](PLANNING.md). Work top to bottom — later milestones assume earlier ones are done, not just started.

## Milestone 0 — Prototype (2–3 wks)

Goal: an island on screen, nothing interactive yet.

- [x] Scaffold Vite + TypeScript project, add three.js
- [ ] Set up `src/` layout (`scene/`, `systems/`, `shaders/`, `ui/`, `quality/`) per PLANNING.md
- [ ] Add `main.ts` render loop with delta-time clock
- [ ] Build placeholder island terrain mesh (static, no deformation)
- [ ] Add flat ocean plane (no wave shader yet)
- [ ] Implement `Camera.ts` — damped orbit/pan, clamped to keep the island framed
- [ ] Implement `Sky.ts` — procedural sky + positioned sun/directional light
- [ ] Set up `EffectComposer` with ACES tone mapping
- [ ] Deploy an early build to a preview URL for visual sign-off

## Milestone 1 — Core interactivity (3–4 wks)

Goal: the three systems that make Isla *Isla* — sand, water, wind.

- [ ] Implement `WindSystem.ts` — shared uniform (direction, strength, gust noise)
- [ ] Implement `SandSystem.ts` — height render target with brush-stamp and decay passes
- [ ] Write `sand.vert`/`sand.frag` — vertex displacement + recomputed normals from the height texture
- [ ] Wire pointer/touch raycast onto the beach plane to drive the sand brush
- [ ] Add sand particle kick-up on fast drags
- [ ] Implement `OceanSystem.ts` and `water.vert`/`water.frag` — summed Gerstner waves, Fresnel reflect/refract
- [ ] Add shoreline interaction — wet-sand darkening band and foam line sampling the sand height texture
- [ ] Source/model coconut trees (glTF, Draco) and place in scene
- [ ] Write `foliage.vert` — wind-driven sway with per-instance phase offset

## Milestone 2 — Polish (2–3 wks)

Goal: the scene feels inhabited and runs everywhere it needs to.

- [ ] Source/model 1–2 beach huts (thatched roof) with one cloth element each (curtain or hammock)
- [ ] Wire hut cloth to the `WindSystem` uniform
- [ ] Add warm interior hut glow for dusk lighting
- [ ] Implement `AudioSystem.ts` — looping surf/wind bed with fade in/out
- [ ] Build `Controls.ts` — corner-docked mute toggle and quality toggle
- [ ] Implement `DeviceProfile.ts` — capability probe driving shadow resolution, wave-mesh density, and pixel ratio
- [ ] Build `HintOverlay.ts` — idle-fade "touch the sand" hint, dismissed permanently on first interaction
- [ ] Add bloom on water highlights; gate SSAO to the top quality tier only
- [ ] Compress assets — Draco geometry, KTX2 textures, trim/loop audio beds
- [ ] Mobile pass on a real mid-range Android device — touch parity, adaptive quality behavior

## Milestone 3 — Launch (1–2 wks)

Goal: shipped, measured, stable.

- [ ] Cross-browser QA — Chrome, Firefox, desktop Safari, mobile Safari, mobile Chrome
- [ ] Profile frame time (Spector.js / DevTools); fix hot spots against the 60fps desktop / 30fps mobile targets
- [ ] Run Lighthouse; confirm <3s desktop / <5s mobile time-to-interactive
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
