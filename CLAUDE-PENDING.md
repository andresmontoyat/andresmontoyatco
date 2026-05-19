# Pendientes — sesión cerrada 2026-05-19

Documento generado al cerrar sesión para registrar todo el trabajo que queda abierto. Antes de hacer backup revisar esta lista para no perder contexto.

## Estado actual

- **Milestone:** v3.6 — AI Practice & Brand Refresh
- **Progreso:** 60 % — 3 fases completas (7, 8, 9), Phase 10 UAT en curso, Phase 11 sin empezar
- **Última actividad:** Phase 10 UAT Test #1 ✓ pass (2026-05-18); Test #2–11 pendientes

## Phase 10 — UAT real-browser (10/11 tests pendientes)

Archivo: `.planning/phases/10-real-browser-uat-a11y/10-UAT.md`

| # | Test | Estado |
|---|------|--------|
| 1 | Dev mode + dark→light @ 1440px | ✓ pass (2026-05-18) |
| 2 | Theme @ iPhone 14 (390×844) — hamburger + ThemeToggle | pending |
| 3 | Production build (`npm run build && npx serve dist`) toggle | pending |
| 4 | localStorage persistence (`cam-theme: 'light'` survive close-tab) | pending |
| 5 | Hero photo @ all viewports (iPhone 14, iPad, 1440px) | pending |
| 6 | Hero photo light mode (brightness 0.85, overlay tint, h1 legible) | pending |
| 7 | Reduced-motion (`prefers-reduced-motion: reduce` suppresses anims) | pending |
| 8 | Nav scroll-spy + click → #claude-code (Desktop + Mobile) | pending |
| 9 | Claude section content + CTAs + bilingual toggle | pending |
| 10 | WCAG AA contrast en light mode (Claude section, axe/Lighthouse) | pending |
| 11 | Lighthouse mobile: Perf ≥95 / A11y 100 / BP 100 / SEO 100 | pending |

**Cómo retomar:**
```bash
npm run dev           # http://localhost:5173
# Hard-refresh (Cmd+Shift+R) para tomar 18 fixes post-review
```
Cada test reportar `pass` o `fail: <observación>`.

## Phase 11 — Architecture diagrams (cross-repo) — sin empezar

Bloqueada por Phase 10 cerrada. Spec en `.planning/ROADMAP.md` líneas 80–91.

**Requirement:** DIAGRAMS-01

**Sub-tareas:**
- `spring-ai-qdrant-mcp`: adoptar gradle PlantUML (`io.gitlab.plunts.plantuml v2.3.0`) + Structurizr DSL + tarea `structurizrExport`
- Cada repo no-JVM (GSD, claude-kanban, ci-templates, caveman): 1–2 diagramas Mermaid `.mmd` en `docs/architecture/`
- `scripts/sync-diagrams.sh` en este repo: copia outputs de cada AI repo a `public/claude-code/diagrams/<repo-slug>/`, idempotente
- AI section app cards clicables → modal con Mermaid live (`mermaid.js`) o `<img>` para SVG/PNG, focus trap, close on Esc/backdrop
- Modal + mermaid.js lazy-loaded — no inflar main bundle

**Próximo paso si se retoma:** `/gsd-discuss-phase 11` (no existe CONTEXT.md aún).

## Code review Info findings — 15 items diferidos

Fixes Critical+Warning aplicados (18/18). Info findings quedaron fuera de scope.

| Phase | Info count | Archivo |
|-------|-----------|---------|
| 7 | 4 | `.planning/phases/07-tailwind-css-var-refactor/07-REVIEW.md` |
| 8 | 5 | `.planning/phases/08-hero-photo-integration/08-REVIEW.md` |
| 9 | 6 | `.planning/phases/09-ai-claude-code-section/09-REVIEW.md` |

**Opciones:**
1. Aplicar con `/gsd-code-review 7 --fix --all` (incluye Info) — repetir para 8 y 9
2. Diferir a backlog: crear `999.13-code-review-info-debt` phase dir
3. Dejar como está — Info son polish, no bloquean v3.6

## Backlog v3.7 (12 items en `999.x` phase dirs)

Scaffolded 2026-05-16. Cada dir tiene `README.md` stub con REQ + goal.

| Phase | REQ | Slug |
|-------|-----|------|
| 999.1 | DEPLOY-01 | deploy-vercel-auto |
| 999.2 | DEPLOY-02 | deploy-custom-domain |
| 999.3 | DEPLOY-03 | deploy-pr-preview |
| 999.4 | VIS-02 | vis-company-logos |
| 999.5 | VIS-04 | vis-testimonials |
| 999.6 | ASEO-01 | aseo-jsonld-person |
| 999.7 | ASEO-02 | aseo-webp-pipeline |
| 999.8 | ASEO-03 | aseo-sitemap |
| 999.9 | INTX-01 | intx-contact-form |
| 999.10 | INTX-02 | intx-blog |
| 999.11 | INTX-03 | intx-github-activity |
| 999.12 | TEST-INFRA | test-infrastructure |

Revisar con `/gsd-review-backlog` al iniciar v3.7.

## Untracked files (NO commiteados — decidir antes de backup)

```
?? CV_Carlos_Montoya_EN.docx          ← duplicado de public/
?? CV_Carlos_Montoya_ES.docx          ← duplicado de public/
?? public/CV_Carlos_Montoya_EN.docx   ← versión .docx (existe .pdf ya en repo?)
?? public/CV_Carlos_Montoya_ES.docx   ← idem
?? website-new/                       ← directorio desconocido — investigar
```

**Recomendación antes de backup:**
- Inspeccionar `website-new/` — puede ser experimento perdido o trabajo paralelo
- CV docx root-level (no en `public/`): mover a `public/` o borrar — actualmente no son servidos
- Decidir si .docx reemplazan o complementan los .pdf existentes en `public/`

## Comandos de retoma rápida

```bash
# Resumir contexto
/gsd-resume-work

# Continuar UAT
npm run dev
# luego: "run UAT test 2" (o el siguiente pendiente)

# Saltar a Phase 11 (si se decide diferir UAT)
/gsd-discuss-phase 11

# Limpiar Info findings
/gsd-code-review 7 --fix --all
/gsd-code-review 8 --fix --all
/gsd-code-review 9 --fix --all
```

## Servidor dev

Stopped (task `bi2h9dqv8`). Re-launch con `npm run dev`.

## Recordatorio sesión

- Caveman mode activo full
- Carpeta primaria: iCloud (`com~apple~CloudDocs/.../andresmontoyatco`)
- Alterna sync: `/Users/usuario/Development/repositories.nosync/codehunters/andresmontoyatco`
- Verificar ambos en backup si están en sync
