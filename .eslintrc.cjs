/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint/eslint-plugin',
        'import',
        'prettier',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.cjs', '.prettierrc.cjs', 'dist/*'],
    rules: {
        'prettier/prettier': ['warn'],
        'import/extensions': ['error', 'ignorePackages'],
        'import/no-cycle': ['error'],
        'no-void': ['error', { allowAsStatement: true }],
        'max-classes-per-file': ['error', 1],
        'class-methods-use-this': 'off',
        'no-param-reassign': 'warn',
        'no-underscore-dangle': 'error',
        '@typescript-eslint/unbound-method': 'error',
        '@typescript-eslint/explicit-member-accessibility': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': [ 'error', { 'argsIgnorePattern': '\_.+' } ],
        '@typescript-eslint/no-empty-interface': [
            'error',
            {
                allowSingleExtends: true,
            },
        ],
    },
    overrides: [
        {
            files: ['**/*spec.ts'],
            plugins: ['jest'],
            env: {
                jest: true,
            },
            rules: {
                // you should turn the original rule off *only* for test files
                '@typescript-eslint/unbound-method': 'off',
                'jest/unbound-method': 'error',
            },
        },
    ],
};
