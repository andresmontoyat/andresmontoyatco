module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // ── Formatting — intentionally relaxed ──────────────────────────────
    semi: 0,
    'comma-dangle': 0,
    'arrow-parens': 0,
    'padded-blocks': 0,
    'object-curly-newline': 0,
    'no-multi-spaces': 0,
    'max-len': 0,

    // ── JSX conventions ─────────────────────────────────────────────────
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/jsx-props-no-spreading': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/jsx-closing-tag-location': 0,
    'react/jsx-props-no-multi-spaces': 0,
    'react/self-closing-comp': 0,

    // ── Props / types ────────────────────────────────────────────────────
    'react/prop-types': 0,

    // ── Import resolution — Vite handles aliases via jsconfig/vite.config ─
    'import/no-unresolved': 0,
    'import/extensions': 0,

    // ── Misc ─────────────────────────────────────────────────────────────
    'class-methods-use-this': 0,
    'no-console': 'warn',
    'react/no-array-index-key': 'warn',
    'react/button-has-type': 'warn',

    // ── Accessibility — keep these as warnings not errors for now ────────
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    'jsx-a11y/control-has-associated-label': 'warn',
    'jsx-a11y/heading-has-content': 'warn',

    // ── Security ─────────────────────────────────────────────────────────
    // react/no-danger: kept OFF intentionally (About.js uses dangerouslySetInnerHTML
    // for local-only static translation strings — no XSS risk. See CONCERNS.md.)
    'react/no-danger': 0,
  },
}
