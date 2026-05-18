module.exports = {
  env: {
    // Jest sets NODE_ENV=test. Native dynamic import() otherwise never resolves for
    // `import('./nodeTestRequest.js')` under babel-jest, so i18nReady hangs.
    test: {
      plugins: ['babel-plugin-dynamic-import-node'],
    },
  },
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
