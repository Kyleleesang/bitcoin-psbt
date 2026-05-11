const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'node',
  // Transform ESM packages that bitcoinjs-lib depends on
  transformIgnorePatterns: [
    'node_modules/(?!(bitcoinjs-lib|ecpair|bip32|@bitcoin-js|tiny-secp256k1)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['lib/**/*.js', '!lib/constants.js'],
  coverageThreshold: {
    global: { lines: 70 },
  },
});
