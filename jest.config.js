/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js', // <-- Add the path to your setup file here
    // If you have other setup files, list them here too
  ],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^assets(.*)$': '<rootDir>/assets$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json', // Point to your project's tsconfig
      isolatedModules: true, // This is key: prevents type checking across files, incl. node_modules
      // You can optionally add diagnostics: false if isolatedModules isn't enough,
      // but isolatedModules is generally preferred for this specific problem.
      // diagnostics: false,
    },
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/expo-env.d.ts',
    '!**/.expo/**',
  ],
};
