import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import boundaries from 'eslint-plugin-boundaries'

/**
 * The Clean Architecture dependency rule is enforced here, not just described
 * in CLAUDE.md:
 *
 *   presentation -> application -> domain
 *   infrastructure -> domain
 *   domain -> nothing
 *
 * The composition root is the single exception: it is allowed to see every
 * layer, because wiring concretes into ports is its whole job.
 */
export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks, boundaries },
    settings: {
      // The '@' alias must resolve, otherwise boundaries silently classifies
      // every aliased import as unknown and enforces nothing.
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'test', pattern: ['src/test/**', 'src/**/__tests__/**'], partialMatch: false },
        { type: 'domain', pattern: 'src/domain/**', partialMatch: false },
        { type: 'application', pattern: 'src/application/**', partialMatch: false },
        { type: 'infrastructure', pattern: 'src/infrastructure/**', partialMatch: false },
        { type: 'presentation', pattern: 'src/presentation/**', partialMatch: false },
        { type: 'composition', pattern: 'src/composition/**', partialMatch: false },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'Read time through the Clock port instead of constructing a Date directly.',
        },
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message: 'Read time through the Clock port instead of calling Date.now().',
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: [{ element: { type: 'domain' } }], allow: [{ to: { element: { type: 'domain' } } }] },
            {
              from: [{ element: { type: 'application' } }],
              allow: [{ to: { element: { type: ['application', 'domain'] } } }],
            },
            {
              from: [{ element: { type: 'infrastructure' } }],
              allow: [{ to: { element: { type: ['infrastructure', 'domain'] } } }],
            },
            {
              from: [{ element: { type: 'presentation' } }],
              allow: [
                { to: { element: { type: ['presentation', 'application', 'domain', 'infrastructure', 'composition'] } } },
              ],
            },
            {
              from: [{ element: { type: 'composition' } }],
              allow: [
                { to: { element: { type: ['composition', 'application', 'domain', 'infrastructure', 'presentation'] } } },
              ],
            },
            {
              from: [{ element: { type: 'test' } }],
              allow: [
                {
                  to: {
                    element: {
                      type: ['test', 'domain', 'application', 'infrastructure', 'presentation', 'composition'],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    // The domain and the application layer must stay free of frameworks and
    // storage. boundaries governs internal elements only, so external packages
    // are blocked here.
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    ignores: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'The domain and application layers must not depend on React.' },
            { name: 'react-dom', message: 'The domain and application layers must not depend on React.' },
            { name: 'react-i18next', message: 'The domain and application layers must not depend on React.' },
            { name: 'dexie', message: 'Storage belongs in the infrastructure layer, behind a port.' },
            { name: 'i18next', message: 'Translation is a presentation concern.' },
          ],
          patterns: [
            {
              group: ['@/infrastructure/*', '@/presentation/*', '**/infrastructure/*', '**/presentation/*'],
              message: 'Inner layers must not import from outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // Adapters exist precisely to wrap the platform clock and randomness.
    files: ['src/infrastructure/adapters/**', 'src/domain/model/local-date.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/**/__tests__/**', 'src/test/**', 'e2e/**', '*.config.ts', 'eslint.config.js'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
)
