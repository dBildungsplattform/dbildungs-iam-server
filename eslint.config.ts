import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import jest from "eslint-plugin-jest";
import { ESLint, Linter } from "eslint";
import prettier from 'eslint-plugin-prettier';

const rules: Partial<Linter.RulesRecord> = {
    'class-methods-use-this': 'off',
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'smart'],
    'max-classes-per-file': ['error', 1],
    'no-void': ['error', { allowAsStatement: true }],
    'no-console': ['warn'],
    'no-param-reassign': 'warn',
    'no-underscore-dangle': 'error',
    'no-await-in-loop': 'error',
    'no-duplicate-imports': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-use-before-define': 'error',
    'no-template-curly-in-string': 'error',
    'no-promise-executor-return': 'error',
    // 'import/extensions': ['error', 'ignorePackages'],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/no-cycle': ['error'],
    'prettier/prettier': ['warn'],
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/typedef': [
        'warn',
        {
            arrayDestructuring: true,
            arrowParameter: true,
            memberVariableDeclaration: true,
            objectDestructuring: true,
            parameter: true,
            propertyDeclaration: true,
            variableDeclaration: true,
            variableDeclarationIgnoreFunction: true,
        },
    ],
    '@typescript-eslint/unbound-method': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-unused-vars': ['error',
        {
            "args": "all",
            "argsIgnorePattern": "^_",
            "caughtErrors": "all",
            "caughtErrorsIgnorePattern": "^_",
            "destructuredArrayIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "ignoreRestSiblings": true
        }
    ],
    '@typescript-eslint/no-empty-interface': [
        'error',
        {
            allowSingleExtends: true,
        },
    ],
};

const plugins: Record<string, ESLint.Plugin> = { tseslint: tseslint, import: importPlugin, prettier: prettier };
const languageOptions: Linter.LanguageOptions = {
    parser: tseslint.parser,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: ['./tsconfig.json'],
    },
};

export default defineConfig(
    globalIgnores(['eslint.config.ts', 'eslint.config copy.ts', '.eslintrc.cjs', '.prettierrc.cjs', 'dist/*', 'node_modules/*', 'coverage/*']),
    {
        name: 'ts-config',
        extends: [
            tseslint.configs.recommendedTypeChecked,
        ],
        plugins: plugins,
        languageOptions: languageOptions,
        files: ['**/*.ts'],
        ignores: ['**/*spec.ts', 'test-migrations/**/*.ts', 'migrations/**/*.ts'],
        rules: rules,
    },
    {
        name: 'jest-config',
        extends: [
            tseslint.configs.recommendedTypeChecked,
        ],
        plugins: { ...plugins, jest: jest },
        languageOptions: languageOptions,
        files: ['**/*spec.ts'],
        rules: {
            ...rules,
            // you should turn the original rule off *only* for test files
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-empty-function': 'off',
        },
    },
    {
        extends: [
            tseslint.configs.recommendedTypeChecked,
        ],
        plugins: plugins,
        languageOptions: languageOptions,
        files: ['test-migrations/**/*.ts', 'migrations/**/*.ts' ],
        rules: {
            ...rules,
            'no-await-in-loop': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/no-empty-function': 'off',
        },
    },
);
