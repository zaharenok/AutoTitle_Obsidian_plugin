module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'obsidian'
  ],
  rules: {
    // Obsidian plugin specific rules
    'no-console': 'off', // Allow console methods for debugging
    'prefer-const': 'error',
    'no-var': 'error',
    'no-async-promise-executor': 'error',
    'require-await': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    // Custom rules for Obsidian bot requirements
    'no-restricted-globals': ['error', 'navigator'],
    'no-restricted-properties': ['error', {
      'property': 'language',
      'object': 'navigator'
    }]
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '*.js', 'tests/']
};