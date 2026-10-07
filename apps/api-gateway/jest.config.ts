export default {
  displayName: 'api-gateway',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api-gateway',
  moduleNameMapper: {
    '^@mtw/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@mtw/config$': '<rootDir>/../../libs/config/src/index.ts',
    '^@mtw/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
    '^@mtw/database$': '<rootDir>/../../libs/database/src/index.ts',
    '^@mtw/messaging$': '<rootDir>/../../libs/messaging/src/index.ts',
    '^@mtw/cache$': '<rootDir>/../../libs/cache/src/index.ts',
    '^@mtw/queue$': '<rootDir>/../../libs/queue/src/index.ts',
    '^@mtw/http-client$': '<rootDir>/../../libs/http-client/src/index.ts',
    '^@mtw/security$': '<rootDir>/../../libs/security/src/index.ts',
    '^@mtw/storage$': '<rootDir>/../../libs/storage/src/index.ts',
    '^@mtw/observability$': '<rootDir>/../../libs/observability/src/index.ts',
    '^@mtw/testing$': '<rootDir>/../../libs/testing/src/index.ts',
  },
};
