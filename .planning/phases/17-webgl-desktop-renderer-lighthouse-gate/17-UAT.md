---
status: pending
phase: 17-webgl-desktop-renderer-lighthouse-gate
source: 17-01-SUMMARY.md, 17-02-SUMMARY.md, 17-03-SUMMARY.md, 17-04-SUMMARY.md, 17-05-PLAN.md
gate_type: HARD (lighthouse:check exit code)
---

# Phase 17 UAT — WebGL Desktop Renderer & Lighthouse Gate

This is the close-out manual UAT for Phase 17. It covers the 9 tests that require browser / device verification (the other 5 rows of the RESEARCH §"Validation Architecture" 14-row matrix are automated and pass via the 252 Vitest + bundle-gate tests).

**Pre-flight (must pass before starting):**
- `npm run test:run` exits 0 (full Vitest suite GREEN)
- `npm run build:gate` exits 0 (programmatic bundle gate passes — mobile chunk ≤ 38.82 kB gz, no three.js leak)
- `rg "THREE\.|from\s*['\"]three['\"]" dist/assets/GameMode-*.js` returns 0 matches (mobile chunk three.js-free)

---

## Test 1 — Lighthouse mobile HARD gate (SC-4) — BLOCKER 3 flow

**This is the HARD gate. `lighthouse:check`'s exit code IS the verdict. No visual inspection.**

1. Run: `npm run lighthouse:mobile`
   - Self-contained: spins up `npx vite preview --port=4173` itself, runs `npx lighthouse http://localhost:4173 --form-factor=mobile`, writes `./lighthouse-report-mobile.report.json` + `.html`, kills the preview server.
   - **No external static-file-server step needed — the script handles preview itself.**
2. Run: `npm run lighthouse:check`
   - Reads `./lighthouse-report-mobile.report.json`, asserts:
     - Performance ≥ 0.95
     - Accessibility = 1.0
     - Best Practices = 1.0
     - SEO = 1.0
     - target-size audit == 1
   - Exits 0 on PASS, non-zero on any threshold miss.
3. Copy the `lighthouse:check` console output (the PASS/FAIL table with actual scores) into the sign-off block at the bottom of this file.

**PASS:** `lighthouse:check` exits 0.
**HARD FAIL:** `lighthouse:check` exits non-zero. **Phase 17 close BLOCKED.** Investigate likely-failing metric (RESEARCH §12 identifies TBT as most-at-risk on slow-CPU mobile); confirm three.js absent in mobile chunk via the pre-flight rg; if a leak appears, fix and re-run from step 1.

---

## Test 2 — Visual parity SVG ↔ WebGL (D-17-LIB + UI-SPEC parity contract)

1. `npm run dev` (vite serves on http://localhost:5173).
2. Open Chrome DevTools, set viewport ≥ 1024px.
3. Visit `http://localhost:5173/?renderer=webgl` — screenshot the constellation.
4. Visit `http://localhost:5173/?renderer=svg` — screenshot at the same viewport, same theme, same data.
5. Compare side-by-side: 26 nodes at IDENTICAL positions, same category colors, edges visible at matching opacities (weight-1 = subtle, weight-2 = bold).
6. Toggle theme (dark ↔ light) — both renderers update correctly; light-theme stroke rings visible on both.

**PASS:** parity matches within 1-pixel tolerance on node centers; theme reactivity correct on both renderers.

---

## Test 3 — Ambient motion quality (Slice 3)

1. With `?renderer=webgl` on desktop (≥1024px), observe the constellation for 30 seconds at rest (no selection, no filter).
2. **Drift:** nodes show a subtle twinkle (sub-perceptual sinusoidal drift) — no node "moves" enough to be jarring.
3. Select a node → halo pulses at ~2s rhythm (matches Phase 15 `animate-pulse2`).
4. Apply a filter (toggle a chip in SkillFilters so `highlightedSkillIds` becomes non-empty) → highlighted nodes brighten at ~3s rhythm, out of sync with the selected pulse (decoupled phase).

**PASS:** all three motions visible without competing or strobing.

---

## Test 4 — Live swap on resize (D-17-RESIZE-SWAP)

1. Start with viewport ≥ 1024px (WebGL active per capability hook).
2. Select the 'java' node → halo visible on WebGL canvas.
3. Drag the window border to < 1024px → renderer swaps to SVG. The 'java' selection state is preserved (halo still on java).
4. Drag back to ≥ 1024px → renderer swaps back to WebGL. Selection still preserved.

**PASS:** seamless swap in both directions; selection survives the swap.

---

## Test 5 — URL override (D-17-OVERRIDE)

1. On desktop ≥ 1024px, visit `?renderer=svg` → SvgConstellation renders (override forces SVG even though WebGL is capable).
2. Visit `?renderer=webgl` → WebGLConstellation renders.
3. On tablet 768-1023px, visit `?renderer=webgl` → WebGLConstellation renders (override short-circuits viewport gate per RESEARCH §7).

**PASS:** URL param overrides capability gates in both directions.

---

## Test 6 — WebGL context loss (D-17-ERRORBOUNDARY-RUNTIME)

1. With `?renderer=webgl` active, open `chrome://gpucrash` in a new tab to force GPU reset.
2. Return to the portfolio tab → `RendererErrorBoundary` catches the WebGL crash, swaps to SvgConstellation silently. **No error UI, no broken screen.**
3. Open DevTools Console → contains a `[renderer-fallback]` prefix log line.

**PASS:** silent fallback to SVG; `[renderer-fallback]` log line present.

---

## Test 7 — Reduced-motion → SVG (D-17-CAP-GATES)

1. System Preferences → Accessibility → Display → **Reduce Motion: ON** (macOS) / equivalent on Windows / Linux.
2. Reload the page on desktop ≥ 1024px → SvgConstellation renders (capability hook gates WebGL off when `prefers-reduced-motion: reduce`).
3. DevTools Console shows **no** `[renderer-fallback]` log (the gate failed BEFORE WebGL mount — no fallback needed).

**PASS:** SVG renders directly; no fallback log.

---

## Test 8 — Save-Data → SVG (D-17-CAP-GATES)

1. DevTools → Network → throttling → **Slow 3G**, OR set `Object.defineProperty(navigator.connection, 'saveData', { value: true, configurable: true })` in the console.
2. Reload page → SvgConstellation renders (capability hook gates WebGL off when `navigator.connection.saveData === true`).

**PASS:** SVG renders under Save-Data.

---

## Test 9 — FPS counter in dev mode only

1. `npm run dev` + visit `?renderer=webgl` on desktop ≥ 1024px → FPS counter visible in the bottom-left, font-mono, showing ≥ 50 fps (target 60 on modern hardware).
2. `npm run build && grep -c FpsCounter dist/assets/*.js` → returns **0** across all chunks (Vite `import.meta.env.DEV` dead-code elimination removes the FpsCounter import + JSX from production).

**PASS:** widget visible in dev; tree-shaken from prod.

---

## Sign-off

Mark each test PASS / FAIL with date + tester initials.

- [ ] Test 1: `lighthouse:check` exit code = ___  Scores: Perf=___ A11y=___ BP=___ SEO=___ target-size=___  Verdict: PASS / FAIL  (date: _____  by: _____)
- [ ] Test 2: visual parity SVG ↔ WebGL — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 3: ambient motion quality — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 4: live swap on resize — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 5: URL override — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 6: WebGL context loss → SVG fallback — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 7: reduced-motion → SVG — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 8: save-data → SVG — PASS / FAIL  (date: _____  by: _____)
- [ ] Test 9: dev FPS counter visible in dev / tree-shaken in prod — PASS / FAIL  (date: _____  by: _____)

**v3.8 milestone close gate:** Test 1 PASS is HARD — `lighthouse:check` non-zero exit blocks v3.8 close. Tests 2-9 should all PASS but are not individually blocking (any FAIL surfaces as a Phase 17 deferred issue, not a blocker).
