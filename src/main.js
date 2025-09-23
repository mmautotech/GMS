// src/main.js
const { app, BrowserWindow, session } = require("electron");
const path = require("path");

// ✅ Handle Squirrel events (create/remove shortcuts) and exit early when needed
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;
let splashWindow;
let splashShownAt = null;

const DEV_CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://127.0.0.1:5000 http://192.168.18.84:5000 ws: http: https:",
  "worker-src 'self' blob:",
].join("; ");

// ✅ Create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // don’t show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });

  // ✅ Wait for ready-to-show + minimum splash duration
  mainWindow.once("ready-to-show", () => {
    const elapsed = Date.now() - splashShownAt;
    const minTime = 5000; // 5 seconds minimum splash

    const showMain = () => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(
          "document.body.classList.add('fade-out'); setTimeout(() => window.close(), 1000);"
        );
        splashWindow = null;
      }
      mainWindow.show();
    };

    if (elapsed >= minTime) {
      showMain();
    } else {
      setTimeout(showMain, Math.max(0, minTime - elapsed));
    }
  });
}

// ✅ Create splash window
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    fullscreen: true, // fullscreen splash
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
  });

  splashWindow.loadFile(path.join(__dirname, "assets", "splash.html"));
  splashShownAt = Date.now();
}

// ✅ Enforce single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });

  app.whenReady().then(() => {
    // Dev CSP (adjust/remove for prod)
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      const headers = details.responseHeaders || {};
      headers["Content-Security-Policy"] = [DEV_CSP];
      cb({ responseHeaders: headers });
    });

    createSplash();
    createMainWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplash();
      createMainWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
