const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronPlatform", true);
contextBridge.exposeInMainWorld("electronDbLoad", () =>
  ipcRenderer.invoke("electron-db-load")
);
contextBridge.exposeInMainWorld("electronDbSave", (base64) =>
  ipcRenderer.invoke("electron-db-save", base64)
);
