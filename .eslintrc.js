module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'airbnb'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react'
  ],
  rules: {
    semi: 0,
    'react/jsx-filename-extension': 0,
    'padded-blocks': 0,
    'comma-dangle': 0,
    'import/no-unresolved': 0,
    'class-methods-use-this': 0,
    'arrow-parens': 0,
    'jsx-a11y/label-has-associated-control': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'react/prop-types': 0,
    'react/jsx-props-no-spreading': 0,
    'object-curly-newline': 0,
    'max-len': 0,
    'react/jsx-one-expression-per-line': 0
  }
}
