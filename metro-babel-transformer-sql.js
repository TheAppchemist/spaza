/**
 * Custom Babel transformer for Metro.
 * - For .sql files: returns an AST that exports the file content as a string (so Babel never parses SQL as JS).
 * - For all other files: delegates to the default Expo/Metro Babel transformer.
 */
const path = require("path");
const babel = require("@babel/core");

const defaultTransformer = require("metro-babel-transformer");

function transform({ filename, options, plugins, src }) {
  if (path.extname(filename) === ".sql") {
    // Export file content as a string without parsing SQL as JavaScript.
    const code = `module.exports = ${JSON.stringify(src)};`;
    const ast = babel.parseSync(code, {
      ast: true,
      babelrc: false,
      configFile: false,
      filename,
      sourceType: "script",
    });
    return { ast };
  }

  return defaultTransformer.transform({ filename, options, plugins, src });
}

module.exports = {
  transform,
  getCacheKey: defaultTransformer.getCacheKey
    ? defaultTransformer.getCacheKey
    : undefined,
};
