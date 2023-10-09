module.exports = {
  ...require('eslint-config-mantine/.prettierrc.js'),
  bracketSpacing: true,
  printWidth: 80,
  semi: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  overrides: [
    {
      files: '*.mo',
      options: {
        bracketSpacing: true,
        tabWidth: 4,
      },
    },
  ],
};
