// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");
config.resolver.assetExts.push("wasm");
// Custom Babel transformer: .sql files are exported as string modules instead of parsed as JS
config.transformer.babelTransformerPath = path.resolve(
  __dirname,
  "metro-babel-transformer-sql.js"
);

module.exports = config;
