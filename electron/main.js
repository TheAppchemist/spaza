const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const WEB_URL = "http://localhost:8081";
// In production: dist is unpacked to app.asar.unpacked/dist (so Windows can load it)
function getDistPath() {
  if (!app.isPackaged) return path.join(__dirname, "..", "dist", "index.html");
  const appPath = app.getAppPath();
  const unpacked = path.join(path.dirname(appPath), "app.asar.unpacked", "dist", "index.html");
  return unpacked;
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
    const distPath = getDistPath();
    win.loadFile(distPath);
  }

  win.on("closed", () => app.quit());
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
