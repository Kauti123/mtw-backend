export default {
  displayName: 'security',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/libs/security',
  moduleNameMapper: {
    '^@mtw/common$': '<rootDir>/../common/src/index.ts',
    '^@mtw/config$': '<rootDir>/../config/src/index.ts',
    '^@mtw/security$': '<rootDir>/src/index.ts',
  },
};
