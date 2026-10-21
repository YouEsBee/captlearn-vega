const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {readBackendUrl} = require('./backendUrl');

 /**
+ * Metro configuration
+ * https://facebook.github.io/metro/docs/configuration
  *
+ * @type {import('metro-config').MetroConfig}
  */
// babel.config.js writes the backend address into the bundle, so a build with a new address
// must not reuse files transformed with the old one.
const config = {cacheVersion: `backend:${readBackendUrl()}`};
 
module.exports = mergeConfig(getDefaultConfig(__dirname), config);