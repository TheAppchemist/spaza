const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { pathToFileURL } = require("url");

const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const WEB_URL = "http://localhost:8081";
// In production (packaged), use app root so path works on Windows; in dev use __dirname
const DIST_PATH = app.isPackaged
  ? path.join(app.getAppPath(), "dist", "index.html")
  : path.join(__dirname, "../dist/index.html");
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
    // loadURL with file: protocol is more reliable on Windows when loading from asar
    win.loadURL(pathToFileURL(DIST_PATH).href);
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
