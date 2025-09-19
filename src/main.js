const { app, BrowserWindow, session } = require("electron");

let mainWindow;

const DEV_CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://127.0.0.1:5000 ws: http: https:",
  "worker-src 'self' blob:",
].join("; ");

function createWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // ✅ Provided by forge/webpack
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // ✅ Load renderer (provided by forge/webpack)
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // 🔒 Prevent blank child windows (redirect to system browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

// Enforce single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => createWindow());

  app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      const headers = details.responseHeaders || {};
      headers["Content-Security-Policy"] = [DEV_CSP];
      cb({ responseHeaders: headers });
    });

    createWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
