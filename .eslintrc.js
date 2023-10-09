module.exports = {
    extends: ['mantine'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'react/jsx-indent-props': 'off',
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/no-shadow': 'off',
    },
    settings: {
        'import/resolver': {
            typescript: {
                // alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
                // use a glob pattern
                project: './tsconfig.json',
            },
        },
    },
};
