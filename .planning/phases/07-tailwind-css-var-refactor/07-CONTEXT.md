---
phase: 07-tailwind-css-var-refactor
created: 2026-05-12
milestone: v3.6 — AI Practice & Brand Refresh
requirements: [THEME-01, COLOR-01]
discuss_mode: discuss
gray_areas_resolved: [b-light-contrast, d-og-template-scope, f-plan-structure]
---

# Phase 7 Context — Tailwind CSS-var Refactor + Brand Palette Swap

## Goal

Theme toggle actually flips ALL surfaces / text / accents (not just `<body>` bg — fix Phase 5 false-positive), and the brand identity shifts from indigo + coral to blue + emerald in both light and dark modes.

## Requirements In Scope

- **THEME-01** — Refactor `tailwind.config.js` so `colors.ink.*`, `colors.brand.*`, `colors.accent.*`, `colors.text.*` reference CSS variables (`var(--color-*)`) instead of hardcoded hex. Define both `:root` (dark defaults) and `[data-theme="light"]` overrides in `index.css`. Existing Tailwind utility classes used in components (`bg-ink-900`, `text-text-primary`, `border-brand`, etc.) must actually flip when `dataset.theme` toggles.
- **COLOR-01** — Swap brand `#6C63FF` → blue-500 `#3B82F6`; accent `#FF6B6B` → emerald-500 `#10B981`. Update `index.css` token blocks, `tailwind.config.js` gradients (`hero-gradient`, `brand-gradient`, `card-gradient`) + `boxShadow.brand`/`brand-lg` rgba values, Hero.js inline `shadow-[0_0_12px_#6C63FF]`, and `scripts/og-template.html` (4 refs). Regenerate `og-image.png` via `npm run og:gen`.

## Scope Boundary

**In scope:**
- `tailwind.config.js` color tokens + gradients + shadows
- `src/index.css` `:root` + `[data-theme="light"]` blocks
- `src/components/Hero.js` inline shadow (one ref)
- `scripts/og-template.html` (4 refs) + regenerated `og-image.png`
- Verification gate: theme toggle ACTUALLY flips all sections in browser BEFORE color swap proceeds

**Out of scope (this phase):**
- Hero `me.jpg` integration → Phase 8 (HERO-01)
- AI section → Phase 9 (AI-01 + AI-01-CICD)
- Real-browser UAT sweep → Phase 10
- Cross-repo architecture diagrams → Phase 11 (DIAGRAMS-01)
- Any deploy work — DEPLOY-* deferred to v3.7

## Codebase Reuse Notes

- 80 token references across 11 files in `src/components/` and `src/App.js` already use Tailwind utility classes (`bg-ink-900`, `text-text-primary`, `border-brand`, `text-brand`, etc.) — once `tailwind.config.js` color tokens reference CSS vars, **no component changes are required**. This is the critical leverage of THEME-01.
- `src/index.css` already declares CSS variables in `:root` + `[data-theme="light"]` (Phase 5 deliverable), but they referenced `theme(colors.*)` which resolves to fixed hex at compile time. The fix inverts the dependency: Tailwind reads from CSS vars; CSS var blocks own the values.
- The existing Phase 5 `[data-theme="light"]` block in `index.css` is a useful template but must be expanded to cover ALL token classes Tailwind exposes (ink scale, brand variants, accent variants, text variants), not just the four currently in the block.
- `ThemeContext.js` (Phase 5) is correct and reused as-is — toggles `document.documentElement.dataset.theme`. No changes needed.
- `ThemeToggle.js` (Phase 5) is correct and reused as-is.

## Locked Gray-Area Decisions

### b — Light-mode contrast strategy (dual-mode darken)

Both `brand` and `accent` receive darker variants in light mode to pass WCAG AA on text. This is stricter than the Phase 5 pattern (which kept brand same in both modes and only darkened accent), reflecting lessons learned and the explicit goal of WCAG AA across v3.6 surfaces.

**Locked palette per mode:**

```
dark-mode :root {
  --color-brand:        #3B82F6   /* blue-500    */
  --color-brand-light:  #60A5FA   /* blue-400    */
  --color-brand-dark:   #2563EB   /* blue-600    */
  --color-brand-muted:  rgba(59, 130, 246, 0.12)

  --color-accent:       #10B981   /* emerald-500 */
  --color-accent-light: #34D399   /* emerald-400 */
  --color-accent-dark:  #059669   /* emerald-600 */
  --color-accent-muted: rgba(16, 185, 129, 0.12)
}

[data-theme="light"] {
  --color-brand:        #2563EB   /* blue-600  — 4.97:1 on #FFFFFF, AA text */
  --color-brand-light:  #3B82F6   /* blue-500  */
  --color-brand-dark:   #1D4ED8   /* blue-700  */
  --color-brand-muted:  rgba(37, 99, 235, 0.12)

  --color-accent:       #047857   /* emerald-700 — 5.05:1 on #FFFFFF, AA text */
  --color-accent-light: #10B981   /* emerald-500 */
  --color-accent-dark:  #065F46   /* emerald-800 */
  --color-accent-muted: rgba(4, 120, 87, 0.12)
}
```

**Rationale:**
- `#3B82F6` on white = 4.01:1 (fails AA normal text). `#2563EB` = 4.97:1 (passes AA).
- `#10B981` on white = 2.54:1 (fails outright). `#047857` = 5.05:1 (passes AA).
- Light mode is rendered on near-white surfaces, so brand/accent used as text or thin border colors need darker variants.
- Variants `*-light` and `*-dark` are inverted between modes so visual hierarchy direction stays consistent (a "lighter" variant always means more luminous relative to its mode).

### d — `scripts/og-template.html` scope

**Locked: included in Phase 7 scope.** Swap all 4 `#6C63FF` hex refs to `#3B82F6` and run `npm run og:gen` to regenerate `public/og-image.png`. Commit the regenerated PNG.

**Rationale:**
- Brand consistency in social link previews (Twitter card, LinkedIn, Slack, iMessage) matters as much as on-site brand consistency.
- DEBT-02 in v3.5 already touched og-template.html for self-hosted fonts; this is the same surface and the toolchain is healthy.
- Skipping means og-image stays indigo until someone manually re-runs the script — fragile.

### f — Plan structure (2 isolated plans, intermediate verification gate)

**Locked: 2 plans, sequential, with a real-browser verification gate between them.**

- **Plan 07-01: Tailwind config → CSS-var refs (THEME-01)**
  - Refactor `tailwind.config.js`: `colors.ink.*`, `colors.brand.*`, `colors.accent.*`, `colors.text.*` switch to `var(--color-*)` references.
  - Expand `src/index.css` `:root` to declare the full token set (every color Tailwind exposes via tokens) using the CURRENT hex values (`#6C63FF`, `#FF6B6B`, etc.) — no palette change yet.
  - Expand `src/index.css` `[data-theme="light"]` block to mirror the full token set with current light-mode hex values.
  - Verification gate (MANDATORY before Plan B starts): run `npm run dev`, click sun/moon, confirm via screenshots that the page visually flips across all sections at iPhone 14, iPad, and 1440px viewports. Phase 5 false-positive must be paid back HERE — no proceeding to Plan B until this is observed.
- **Plan 07-02: Brand palette swap (COLOR-01)**
  - Replace hex values in `index.css` `:root` and `[data-theme="light"]` per the b-decision palette.
  - Update `tailwind.config.js` gradient definitions (`hero-gradient`, `brand-gradient`, `card-gradient`) and `boxShadow.brand`/`brand-lg` rgba values for the new palette.
  - Update `src/components/Hero.js` inline `shadow-[0_0_12px_#6C63FF]` → use `var(--color-brand)` arbitrary value or new hex.
  - Update `scripts/og-template.html` 4 refs → `#3B82F6`.
  - Run `npm run og:gen` to regenerate `public/og-image.png`.
  - Verification: visual check that the site now reads as blue/emerald in both themes; og-image renders correctly.

**Rationale for splitting:**
- Phase 5 failed because there was no intermediate gate confirming the theme system actually worked before declaring success. Plan 07-01 isolates the refactor; if components stop reacting to the toggle, the bug is clearly in the refactor (no palette confound). Plan 07-02 then becomes a trivial hex swap.
- Smaller diffs → easier review and easier `git bisect` if regressions surface in Phase 10 UAT.
- Atomic commits per file group within each plan.

## Auto-Decided Gray Areas (defaults applied, no user prompt)

- **a — CSS var naming scheme:** Use **token-mirror** names (`--color-ink-900`, `--color-brand`, `--color-brand-light`, `--color-brand-dark`, `--color-brand-muted`, `--color-accent*`, `--color-text-primary/secondary/muted/inverse`). Rationale: cleanest 1:1 mapping with Tailwind config tokens; preserves the existing semantic var names from Phase 5 (`--color-surface-deep`, `--color-text-primary`) as aliases where they're already referenced in raw CSS, but the canonical names mirror token shape so Tailwind config reads cleanly.

- **c — Hero.js inline shadow:** Use Tailwind arbitrary value with CSS var — `shadow-[0_0_12px_var(--color-brand)]`. Rationale: theme-aware automatically; no perpetuation of hardcoded hex; no new `boxShadow.brand-pulse` token needed in `tailwind.config.js` for a one-off.

- **e — Gradient direction & stops:** Keep direction `135deg` and 2-stop structure across all three gradients (`hero-gradient`, `brand-gradient`, `card-gradient`); only swap the hex/rgba values to the new palette. Rationale: visual feel of v3.4/v3.5 stays; only the chroma shifts. No re-think of layout aesthetics this phase.

- **g — `boxShadow.brand` rgba derivation:** Use exact equivalent of `rgba(59,130,246,0.35)` for brand and `rgba(59,130,246,0.55)` for brand-lg — same opacities, new brand RGB. Rationale: shadow visibility on dark surfaces is opacity-sensitive; 0.35/0.55 was already tuned in v3.4 and still works for blue.

- **h — Translation keys:** No copy changes in Phase 7 (THEME-01 + COLOR-01 are pure visual). Skip `src/i18n/translations.js` entirely.

## Verification Plan (handed to Phase 10)

Phase 7 produces internal verification gates between Plan A and Plan B (browser-based theme toggle test). Full WCAG AA contrast audit + Lighthouse re-run + multi-viewport visual sweep is owned by Phase 10 — Phase 7 does NOT skip its internal gate, but does NOT duplicate the Phase 10 sweep.

## Dependencies

- Depends on: v3.5 Phase 6 (Projects Showcase) — already complete.
- Unblocks: Phase 8 (HERO-01), which needs the new brand palette in place for the Hero overlay gradient + text-shadow to render in the v3.6 brand.

## Risks & Mitigations

- **Risk:** Some component uses an arbitrary Tailwind class with hardcoded hex (e.g., `bg-[#6C63FF]`) that grep missed. **Mitigation:** Plan 07-02 task adds a final grep sweep for `#6C63FF` / `#FF6B6B` across `src/` and `scripts/` before commit; any hit is reviewed and either tokenized or explicitly justified.
- **Risk:** Light mode contrast still feels "dim" after darkening accent to `#047857`. **Mitigation:** Phase 10 catches this in the WCAG AA + visual sweep. If subjective, COLOR-01 can be re-tuned in a follow-up Plan; the token system makes that cheap.
- **Risk:** `npm run og:gen` fails on a clean machine because Playwright deps reinstall. **Mitigation:** Plan 07-02 task wraps `og:gen` in a try-run with explicit `npx playwright install` if needed; document in commit message.

## Open Questions (none)

All gray areas resolved. Planner can proceed with Plan 07-01 and Plan 07-02 structure as locked above.
