const {readBackendUrl} = require('./backendUrl');

/** Writes the backend address into the app at build time: process.env.BACKEND_URL becomes a string. */
function inlineBackendUrl({types: t}) {
  const url = readBackendUrl();
  return {
    visitor: {
      MemberExpression(path) {
        if (path.matchesPattern('process.env.BACKEND_URL')) {
          path.replaceWith(t.stringLiteral(url));
        }
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      '@babel/plugin-transform-react-jsx',
      {
        runtime: 'automatic',
      },
    ],
    inlineBackendUrl,
  ]
};
