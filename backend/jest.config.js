export default {
    testEnvironment: 'node',

    // --------------------
    // Test discovery
    // --------------------
    testMatch: [
        '**/tests/integration/**/*.test.js',
        '**/tests/unit/**/*.test.js',
    ],

    // --------------------
    // Mock behavior
    // --------------------
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,

    // --------------------
    // Coverage
    // --------------------
    collectCoverage: true,
    coverageDirectory: 'coverage',

    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middlewares/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
    ],

    // ⚠️ Relax thresholds for integration tests
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // --------------------
    // ESM + Babel
    // --------------------
    transform: {
        '^.+\\.js$': 'babel-jest',
    },

    // --------------------
    // Timeouts (important for DB + Supertest)
    // --------------------
    testTimeout: 30000,

    // --------------------
    // Setup hooks
    // --------------------
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
};
