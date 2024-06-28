module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/modules/(.*)$': '<rootDir>/src/frontend/src/modules/$1',
    '\\.css$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
