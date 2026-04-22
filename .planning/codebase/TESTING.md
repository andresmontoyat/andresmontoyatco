# Testing Patterns

**Analysis Date:** 2026-04-21

## Test Framework

**Runner:**
- Jest — bundled via `react-scripts` / CRACO (`craco test`)
- No standalone `jest.config.js` present; Jest configuration is managed entirely by `react-scripts`
- Config: `package.json` `eslintConfig` block references `react-app/jest` for ESLint in test files

**Assertion Library:**
- `@testing-library/react` — included transitively by `react-scripts` (standard CRA setup)

**Run Commands:**
```bash
npm test          # Watch mode (default CRA behavior via craco test)
npm test -- --watchAll=false    # Single run / CI mode
npm test -- --coverage          # Coverage report
```

## Current State: No Tests Written

There are **zero test files** in this codebase. No `.test.js`, `.spec.js`, or `__tests__/` directories exist anywhere under `src/`.

The `test` script in `package.json` is the default CRA placeholder:
```json
"test": "craco test"
```

No CI pipeline (no `.github/workflows/` directory at the project root) enforces test execution.

## What CRA Provides Out of the Box

Because the project uses `react-scripts` via CRACO, the following test infrastructure is available without additional installation:

- **Jest** — test runner and assertion engine
- **@testing-library/react** — component rendering utilities (`render`, `screen`, `fireEvent`, `userEvent`)
- **@testing-library/jest-dom** — custom matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- **@testing-library/user-event** — user interaction simulation
- Jest supports `jsdom` environment automatically for browser API simulation

## Recommended Test File Placement

Per CRA convention (no project-specific pattern established):
- Place test files co-located next to the source file they test
- Name: `ComponentName.test.js` alongside `ComponentName.js`

```
src/
├── components/
│   ├── Nav.js
│   ├── Nav.test.js          ← test file goes here
│   ├── Hero.js
│   └── Hero.test.js
├── i18n/
│   ├── LanguageContext.js
│   └── LanguageContext.test.js
└── data/
    ├── experience.js
    └── experience.test.js
```

## Recommended Test Structure

Match the project's i18n and context setup in tests:

```javascript
import React from 'react'
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../i18n/LanguageContext'
import Hero from './Hero'

// Wrapper required because components consume useLanguage()
function renderWithLanguage(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('Hero', () => {
  it('renders the CTA button', () => {
    renderWithLanguage(<Hero />)
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
  })
})
```

## Key Testing Considerations

**LanguageContext dependency:**
Every component calls `useLanguage()` — all component tests require wrapping in `<LanguageProvider>`. A shared test helper wrapper is needed.

**`dangerouslySetInnerHTML` in About.js:**
`t.about.p1`, `t.about.p2`, `t.about.p3` are rendered as raw HTML. Tests should verify content is rendered without asserting exact HTML structure.

**Experience expand/collapse:**
`Experience.js` has local `useState` for the expand toggle. Interaction tests with `userEvent.click()` are the appropriate approach.

**Static data:**
`src/data/experience.js` exports a plain JS array — unit-testable without React at all. Validate data shape, required fields, and bilingual completeness.

**Language switching:**
`Nav.js` renders EN/ES toggle buttons. Integration tests can verify language switch updates displayed text across the page.

## Mocking

**No mocking infrastructure is configured.** For this project:
- `localStorage` — Jest's jsdom provides a working implementation; no mock needed
- `navigator.language` — override via `Object.defineProperty(navigator, 'language', { value: 'es' })` in test setup if needed
- No external API calls to mock (axios is installed but not used in any component)

## Coverage

**Requirements:** None enforced — no coverage threshold configuration exists.

**View Coverage:**
```bash
npm test -- --coverage --watchAll=false
```

Coverage reports to `coverage/` directory (gitignored by default CRA setup).

## Test Types

**Unit Tests:**
- Appropriate for: `src/data/experience.js` (data shape validation), `src/i18n/translations.js` (key completeness between `en` and `es`)
- No React renderer needed

**Component Tests:**
- Appropriate for all files in `src/components/` and `src/i18n/LanguageContext.js`
- Use `@testing-library/react` with `render` + `screen` queries
- Always wrap in `<LanguageProvider>` or a custom `renderWithLanguage` helper

**Integration Tests:**
- Render full `<App />` to verify section assembly, navigation anchor links, and language toggle propagation

**E2E Tests:**
- Not configured. No Cypress, Playwright, or similar framework installed.

---

*Testing analysis: 2026-04-21*
