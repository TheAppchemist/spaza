const { app, BrowserWindow, ipcMain, protocol, net } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { pathToFileURL } = require("url");

const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const WEB_URL = "http://localhost:8081";
const APP_PROTOCOL = "app";

function getDistDir() {
  if (!app.isPackaged) return path.join(__dirname, "..", "dist");
  const appPath = app.getAppPath();
  return path.join(path.dirname(appPath), "app.asar.unpacked", "dist");
}

const PRELOAD_PATH = path.join(__dirname, "preload.js");

const DB_FILENAME = "accounting.db";

function getDbPath() {
  return path.join(app.getPath("userData"), DB_FILENAME);
}

ipcMain.handle("electron-db-load", async () => {
  const dbPath = getDbPath();
  try {
    const data = await fs.readFile(dbPath);
    return data.toString("base64");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
});

ipcMain.handle("electron-db-save", async (_event, base64) => {
  if (typeof base64 !== "string") return;
  const dbPath = getDbPath();
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(dbPath, buffer);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
    title: "Spaza Accounting",
  });

  if (isDev) {
    win.loadURL(WEB_URL);
    win.webContents.openDevTools();
  } else {
    // Load via custom protocol so absolute paths (/_expo/...) resolve to dist/
    win.loadURL(`${APP_PROTOCOL}://localhost/index.html`);
  }

  win.on("closed", () => app.quit());
}

// Custom protocol: app:// serves files from dist (fixes ERR_FILE_NOT_FOUND and dynamic chunk loading)
protocol.registerSchemesAsPrivileged([
  { scheme: APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

app.whenReady().then(() => {
  const distDir = getDistDir();
  protocol.handle(APP_PROTOCOL, (request) => {
    const u = new URL(request.url);
    let p = decodeURIComponent(u.pathname || "/");
    if (p.startsWith("/")) p = p.slice(1);
    if (!p || p === "/") p = "index.html";
    const filePath = path.join(distDir, p);
    const fileUrl = pathToFileURL(filePath).href;
    return net.fetch(fileUrl);
  });
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
