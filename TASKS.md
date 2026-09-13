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

- [x] Cross-browser QA — **Chrome/Chromium only, by the user's choice**: no Firefox is installed and Safari can't be tested on Windows at all (not an installable gap). Did a full desktop pass (sand drag, camera orbit gestures, mute/quality toggles, hint dismiss — all correct, console clean on a fresh tab) and a mobile-emulated pass (375×812, coarse pointer: layout adapts, low quality tier auto-selects, touch drag works). Firefox, desktop Safari, and mobile Safari remain genuinely unverified — flagged for the user or a follow-up session with access to those.
- [x] Profile frame time — **the automated browser pane can't sustain a real render loop for this**: `requestAnimationFrame` is effectively stalled unless something (a screenshot, a dispatched event) forces a repaint, so sampled frame times were nonsense (frames minutes apart). This isn't fixable from here — it needs a real, non-automated Chrome DevTools session or a real device (same limitation as the Milestone 2 mobile-device task). Used `renderer.info` instead as a static complexity proxy: 27 geometries, 22 textures, 26 shader programs — a genuinely light scene — plus Lighthouse's load-time metrics as the best available substitute signal.
- [ ] Run Lighthouse; confirm <3s desktop / <5s mobile time-to-interactive — ran against both the local production build and the deployed Vercel URL. **Desktop:** TTI 1.6s, comfortably under budget — met. **Mobile-simulated** (Lighthouse's throttled-CPU/slow-4G profile, deliberately more pessimistic than the PRD's actual "mid-range 2023 phone" target): TTI 5.4s, just over the <5s line — **not yet met**. Found and fixed two real causes along the way — `SSAOPass` and `GLTFLoader`/`DRACOLoader` were parsed/compiled up front even though neither is needed for the first interactive frame; lazy-loading both cut Total Blocking Time from 2.46s to 1.81s and the main bundle from 703KB to 637KB (see the `perf:` commits). Left open rather than checked off: closing the remaining ~0.4s gap needs deeper cuts (trimming unused three.js features) than more code-splitting can offer, and is worth a real mid-range-phone measurement (not just Lighthouse's pessimistic simulation) before deciding it's actually still a problem.
- [x] Wire lightweight, privacy-respecting analytics (e.g. Plausible) — user created the Plausible account and supplied the tracking snippet; added to `index.html`'s `<head>`
- [x] Check against PRD success metrics (§8) and the UX bar — touch within 10s of arrival. Load time and 60fps-desktop are covered above. The <10s-to-first-touch bar is met structurally (hint fades in almost immediately, sand is interactive before the hint even appears) but "does a real visitor actually touch it" is a behavioral/analytics question, not a build-time one — that's exactly what the new Plausible wiring is for; there's no traffic to read yet.
- [x] Deploy to production static host; verify CDN asset delivery — live at [3d-island-lemon.vercel.app](https://3d-island-lemon.vercel.app), confirmed serving the latest commit with a clean console. Checked response headers directly: found hashed `/assets/*` files were sent as `max-age=0, must-revalidate` (revalidating with the origin on every repeat visit) instead of long-lived caching, despite Vite's content-hashed filenames making that always safe. Fixed via `vercel.json` (`Cache-Control: public, max-age=31536000, immutable` on `/assets/*`) and confirmed on production after redeploy.
- [x] Confirm zero console errors/warnings across target browsers — **Chrome only** (see cross-browser QA note above). Clean on every fresh-tab check this session (desktop, mobile-emulated, and production). One genuine bug found and fixed along the way: `SSAOPass`/`UnrealBloomPass` had no guard against a momentarily zero-sized viewport at startup (unlike the `resize()` handler, which already had one), producing "framebuffer incomplete" GL warnings until the first real resize corrected it — see the `fix:` commit.

## Backlog (post-MVP — do not start without an explicit ask)

Tracked here so they don't get pulled forward by accident; full rationale in the PRD (§5).

- [ ] Time-of-day lighting cycle
- [ ] Weather (rain, squalls)
- [ ] Shared/multiplayer island
- [ ] Sand tint, hut style, tree density customization
- [ ] Screenshot / share card
- [ ] Ambient wildlife (crabs, gulls, fish)
