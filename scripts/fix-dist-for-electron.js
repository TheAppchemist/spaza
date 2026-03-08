/**
 * After expo export -p web, index.html uses absolute paths (/_expo/...).
 * When Electron loads it via file://, the browser resolves those from the
 * filesystem root and we get ERR_FILE_NOT_FOUND. This script rewrites
 * index.html to use relative paths so file:// works.
 */
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.warn("fix-dist-for-electron: dist/index.html not found, skipping");
  process.exit(0);
}

let html = fs.readFileSync(indexPath, "utf8");

// Absolute paths like src="/_expo/..." -> src="./_expo/..." so file:// loading works
html = html.replace(/(src|href)=(["'])\/_expo\//g, "$1=$2./_expo/");

// Set base so relative resolution is from dist folder
if (!html.includes("<base ")) {
  html = html.replace(/<head[^>]*>/, (head) => head + '\n    <base href="./">');
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("fix-dist-for-electron: rewrote dist/index.html for Electron file:// loading");
