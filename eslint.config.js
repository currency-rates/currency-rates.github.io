import js from '@eslint/js'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['.anton/'] },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
      },
    },
  },
]
