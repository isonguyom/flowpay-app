export default {
    testEnvironment: 'node',
    clearMocks: true,
    restoreMocks: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middlewares/**/*.js',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    transform: {
        '^.+\\.js$': 'babel-jest', // transform JS files with Babel
    },
};
