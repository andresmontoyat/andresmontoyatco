import '@testing-library/jest-dom/vitest'

// jsdom does not implement HTMLCanvasElement.prototype.getContext — calling it
// emits a stderr stack trace and returns undefined. GameMode.detectCapabilities
// probes WebGL via a transient <canvas> on mount; without this mock every test
// rendering <GameMode /> pollutes stderr. Stub to null so the WebGL probe
// silently reports "not supported" and the SVG path (the only Phase 15 path)
// resolves cleanly.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
}

// Node.js 22+ exposes a native `localStorage` on globalThis that prevents
// vitest's populateGlobal from copying jsdom's localStorage to the test global
// scope (populateGlobal skips keys already defined in Node's globalThis).
// Bridge jsdom.window.localStorage/sessionStorage so component code that
// accesses `window.localStorage` and test code that accesses `window.localStorage`
// both reach the jsdom store.
//
// LOAD-BEARING (Phase 14 WR-01): the `jsdom` global is exposed by vitest's
// jsdom environment when `test.environmentOptions.jsdom` is set (see
// vite.config.js). Removing this bridge causes 21 tests to fail on Node 22
// with TypeError "Cannot read properties of undefined (reading 'clear')"
// against `window.localStorage`. Verified locally on 2026-05-30. Do not
// delete without re-running `npm run test:run` on Node 22+ first.
if (typeof jsdom !== 'undefined' && jsdom.window) {
  const jsdomLS = jsdom.window.localStorage
  const jsdomSS = jsdom.window.sessionStorage
  if (jsdomLS) {
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => jsdomLS,
      configurable: true,
    })
    Object.defineProperty(window, 'localStorage', {
      get: () => jsdomLS,
      configurable: true,
    })
  }
  if (jsdomSS) {
    Object.defineProperty(globalThis, 'sessionStorage', {
      get: () => jsdomSS,
      configurable: true,
    })
    Object.defineProperty(window, 'sessionStorage', {
      get: () => jsdomSS,
      configurable: true,
    })
  }
}
