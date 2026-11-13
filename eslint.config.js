import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// React Compiler advisory rules: the planner loads data inside effects (works today). Rewriting
// those effects would change behavior, so they are warnings until the data hooks are refactored.
const reactCompilerAdvisory = {
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/purity": "warn",
}

export default defineConfig([
  globalIgnores(['dist', 'backup/*/**', 'dev-dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: reactCompilerAdvisory,
  },
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactCompilerAdvisory,
      // JSX usage of imported components counts as "used".
      'no-unused-vars': ['error', { varsIgnorePattern: '^(React|[A-Z_])', argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    // Node scripts (backup + one-off inspection scripts)
    files: ['backup/**/*.mjs', 'scripts/**/*.{js,cjs}', '*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
])
