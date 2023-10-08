module.exports = {
  ...require('eslint-config-mantine/.prettierrc.js'),
  bracketSpacing: true,
  printWidth: 80,
  semi: true,
  tabWidth: 4,
  trailingComma: 'es5',
  useTabs: false,
  overrides: [
    {
      files: '*.mo',
      options: {
        bracketSpacing: true,
      },
    },
  ],
};
