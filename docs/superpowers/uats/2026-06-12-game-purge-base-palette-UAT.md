# UAT — v4.0 Slice 1 (Game Purge + Base Palette)

**PR:** [#26](https://github.com/andresmontoyat/andresmontoyatco/pull/26)
**Branch:** `v4.0-slice-1-purge`
**Spec:** [`docs/superpowers/specs/2026-06-12-game-purge-base-palette-design.md`](../specs/2026-06-12-game-purge-base-palette-design.md)
**Plan:** [`docs/superpowers/plans/2026-06-12-game-purge-base-palette.md`](../plans/2026-06-12-game-purge-base-palette.md)
**Date opened:** 2026-06-12

---

## Scope

This slice ONLY purges the failed game-mode lineage and lands the global dark palette. **No section is rebuilt yet.** The page is intentionally minimal:

- Nav (sticky top) — bilingual EN/ES + theme toggle + anchor links to non-existent sections
- Hero — existing component, absorbs new palette via repointed `--color-ink-*` / `--color-brand` vars
- Footer — existing component, same absorption

About / Skills / Experience / Projects / Claude / Contact are **not rendered** — they ship in their own future slices.

If a test below feels wrong for this scope (e.g., "section anchors broken"), check the *Out-of-scope* row before failing it.

---

## Pre-UAT setup

- [ ] PR #26 has a Vercel preview deploy. Copy the preview URL into the **UAT URL** field below.
  - **UAT URL:** `https://________________________________.vercel.app`
- [ ] Open in **two real browsers**: Chrome desktop + Safari/Chrome on a real phone (or DevTools mobile emulation if a phone isn't handy — note which).
- [ ] Open DevTools Console + Network tab; clear before each item.

---

## Sweep — 16 items

Fill the **Result** column inline. Use `PASS` / `FAIL` / `N/A`. If `FAIL`, paste evidence (screenshot link, console line, etc.) in the **Notes** column.

| #  | Item | How to test | Pass criteria | Result | Notes |
|----|------|-------------|---------------|--------|-------|
| 01 | **Site loads** | Open UAT URL on desktop Chrome | Page renders within 3 s, no white screen, no error overlay |        |       |
| 02 | **Console clean** | DevTools Console after first paint | Zero errors. Warnings about source maps or React DevTools are OK |        |       |
| 03 | **Network clean** | DevTools Network, reload page | No 4xx / 5xx. No requests to `/sprites/`, `/game/`, `WebGLConstellation`, `WebGLWorldMap`, `GameMode` chunks |        |       |
| 04 | **Dark base palette** | Eyeball the body background | Deep navy `#0B1020`-ish. NOT the old `ink-900 #12121F`. Subtle radial gradient corners (top-left greenish, top-right cyan-ish) |        |       |
| 05 | **Grid pattern** | Zoom in on background outside text | Faint 44 px square grid visible, fades toward edges (mask-image ellipse). Subtle — should not distract |        |       |
| 06 | **Font stack** | Inspect any body text in DevTools → Computed → font-family | Resolves to `Inter` (or system fallback if Inter not loaded). Mono surfaces (if any) use `JetBrains Mono` |        |       |
| 07 | **Nav renders** | Top of page | Sticky nav visible. Logo / brand on left, links + lang toggle + theme toggle on right (or stacked on mobile). Anchor links present: About, Skills, Experience, Projects, Claude, Contact |        |       |
| 08 | **Language toggle EN↔ES** | Click ES → click EN | Nav labels, Hero text, Footer text swap language. `localStorage.cam-lang` updates. No flash of wrong language |        |       |
| 09 | **Theme toggle** | Click theme toggle if present | Theme switches (dark ↔ light). v4.0 palette only applied to dark mode here; light mode falls back to whatever was pre-existing — acceptable for this slice |        |       |
| 10 | **Hero renders** | Below Nav | Existing Hero component renders. Title + lead + CV download CTA + email CTA visible. Char-reveal animation runs once. **Visual mismatch with target mockup is EXPECTED** — Hero is parked and gets refactored in its own slice |        |       |
| 11 | **Anchor links no-op gracefully** | Click any Nav link (About, Skills, etc.) | Hash updates in URL bar. No console error, no JS crash. Page may not scroll anywhere (sections don't exist). That's expected |        |       |
| 12 | **CV download** | Click "Download CV EN" CTA | `/CV_Carlos_Montoya_EN.docx` downloads. Repeat for ES |        |       |
| 13 | **Footer renders** | Scroll to bottom | Footer visible with tagline + © year + rights line. Translated when language switches |        |       |
| 14 | **Mobile responsive at 375 px** | DevTools mobile emulation (iPhone SE) OR real phone | No horizontal scroll. Nav collapses / wraps cleanly. Hero text readable. Footer stacks |        |       |
| 15 | **Mobile Lighthouse vs deployed URL** | `npx lighthouse <preview-url> --form-factor=mobile --output=json --output-path=./uat-lh.json` | Perf ≥ 0.97 / A11y 1.00 / BP 1.00 / SEO 1.00. Acceptable if Perf is one tick lower (0.95–0.96) on Vercel cold start — re-run twice; lower of the two must still be ≥ 0.95 |        |       |
| 16 | **Cross-browser smoke (Safari iOS)** | Open UAT URL on iPhone Safari | Loads, palette correct, lang toggle works. CSS `mask-image` for grid may render slightly differently — acceptable if grid shows at all |        |       |

---

## Out-of-scope (do NOT raise as bugs in this slice)

- About / Skills / Experience / Projects / Claude / Contact missing from page
- Hero visual not matching `website-new/index.html` target mockup
- Nav visual not matching target mockup (no `<​/cam>` logo, no pill lang toggle)
- Footer visual sparse
- Anchor links not scrolling anywhere
- `?mode=game` / `?mode=dev` query params doing nothing
- `cam-game-onboarded` / `cam-viewmode` / `cam-skill-filters-*` `localStorage` keys remaining (orphaned, harmless)
- Light theme not adopting v4.0 palette (only dark gets recolored in this slice)

These are all tracked for future slices, NOT failures of Slice 1.

---

## Sign-off

When 16/16 items above are PASS (or N/A with justification):

```
UAT sign-off — v4.0 Slice 1
Operator:   ________________
Date:       2026-06-__
Result:     16/16 PASS
Decision:   APPROVE merge → main + tag v4.0-slice-1
```

If any item is FAIL, file the failure in the PR comments with severity:
- **P0** = blocks merge (broken page, console errors, palette not applied, gates regressed)
- **P1** = ship-but-followup (visual nit, Safari quirk, Lighthouse score 0.95–0.96)
- **P2** = note for next slice

---

## Post-merge actions (after sign-off)

1. Squash-merge PR #26 (or fast-forward; operator choice).
2. Tag: `git tag -a v4.0-slice-1 -m "v4.0 Slice 1 — Game Purge + Base Palette" && git push origin v4.0-slice-1`.
3. Delete `v4.0-slice-1-purge` remote branch.
4. Open the next slice — **v4.0 Slice 2 — About** — by re-entering brainstorming (`/superpowers:brainstorming`).
