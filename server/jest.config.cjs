/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/__tests__/jestSetupEnv.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@growth-world/shared$': '<rootDir>/../shared/index.ts',
  },
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
};
