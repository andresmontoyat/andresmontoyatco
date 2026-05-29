import '@testing-library/jest-dom/vitest'

// Node.js 22+ exposes a native `localStorage` on globalThis that prevents
// vitest's populateGlobal from copying jsdom's localStorage to the test global
// scope (populateGlobal skips keys already defined in Node's globalThis).
// Bridge jsdom.window.localStorage/sessionStorage so component code that
// accesses `window.localStorage` and test code that accesses `window.localStorage`
// both reach the jsdom store.
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
