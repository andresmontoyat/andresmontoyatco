# Phase 24 Plan 05: Cross-Browser Manual QA (D-07)

**Purpose:** Discharge the ROADMAP "Escape-key close cross-browser verified" success criterion and research Assumptions A1/A2 (native `<details>` does NOT close on Escape/outside-click without the `details-dismiss.js` enhancer) via real human keypress/click testing in Chrome, Firefox, and Safari. No automated check substitutes for this — see `24-RESEARCH.md` Pitfall 2.

**Status:** NOT YET RUN — scaffold only, awaiting human QA pass.

## How to launch the site under test

```bash
npm run build
npx serve dist
# or: npm run preview
```

Note the local URL printed by the command (typically `http://localhost:3000` for `serve`, or the port Astro's `preview` server prints — record whichever one is actually used below before starting the sweep).

**Local URL used for this pass:** _(fill in when QA starts)_

**Safari note:** Safari-on-a-real-device (or Simulator) is preferred. If Safari is unavailable on the machine running this QA pass, mark every Safari cell below as `GAP — Safari unavailable` explicitly rather than leaving it blank or silently skipping it. Chrome + Firefox is the minimum bar for closing D-07.

## Test matrix

Run every row on both `/en` and `/es`. Record `PASS`, `FAIL` (with a short note), or `GAP` (environment unavailable) per browser.

| # | Check | Chrome | Firefox | Safari |
|---|-------|--------|---------|--------|
| 1 | CV dropdown opens/closes via clicking `<summary>` (native, zero JS) — D-05 | | | |
| 2 | Escape key closes the open dropdown and focus returns to the `<summary>` button — D-07/D-06 core criterion | | | |
| 3 | Outside-click closes the open dropdown — D-06 | | | |
| 4 | Both CV PDF links (`CarlosMontoya_CV_EN.pdf` / `CarlosMontoya_CV_ES.pdf`) download the correct file, checked on both `/en` and `/es` | | | |
| 5 | H1 middle-line typewriter (`steps()` reveal) completes with no visible half-character clip or trailing gap after it settles — Pitfall 1, D-01 | | | |
| 6 | Count-up stats do NOT visibly start counting before the stats block's ~850ms entrance fade-in completes — D-04, Open Question 2 | | | |
| 7 | Hero photo paints promptly as the visible LCP element, no obvious regression vs the current v4.1 2.1s baseline — D-08 | | | |

## Instructions

1. Build and serve the production output (see command above) — do not test against `astro dev`, since Pitfall 1's font-rendering check and Pitfall 4's script-loading check both need real production output.
2. In **each** of Chrome, Firefox, and Safari, open both `/en` and `/es` and walk through rows 1-7 above.
3. For row 2 (Escape close): open the dropdown, press Escape, confirm it closes AND that keyboard focus visibly returns to the "Download CV" summary button (not lost to `<body>`).
4. For row 3 (outside-click close): open the dropdown, click anywhere outside it (e.g. the hero photo or background), confirm it closes.
5. For row 6 (count-up timing): watch the stats bar from page load — if the numbers visibly start animating before the block has finished fading in, note it under Defects below; this would require a fixed start-offset added to `count-up.js`'s `animate()` function (small follow-up, not part of this plan's scope).
6. For row 7 (LCP): a rough visual check is sufficient for this manual pass (photo paints promptly, no flash of unstyled/missing image); a full Lighthouse run against a deployed URL remains Phase 27's formal gate (DEPLOY-04).
7. Record PASS/FAIL/GAP per cell above as you go.

## Defects / Notes

_(record any FAIL details, count-up start-offset tuning needed, or other observations here)_

## Tab-order check (T-24-05-02, Pitfall 3)

Tab through the closed Hero section and confirm the CV dropdown's `<a>` links are NOT reachable in the tab order before the LinkedIn/GitHub icon links that come after (closed `<details>` content should be excluded from tab order natively).

**Result:** _(PASS/FAIL — fill in during QA)_

## Sign-off

- [ ] Escape-close PASS in Chrome + Firefox (Safari PASS or explicit GAP)
- [ ] Outside-click-close PASS in Chrome + Firefox (Safari PASS or explicit GAP)
- [ ] CV PDF links verified downloading on both `/en` and `/es`
- [ ] Typewriter completion, count-up timing, and LCP observations recorded
- [ ] Tab-order check recorded

**QA performed by:** _(name/date)_
