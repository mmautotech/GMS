// src/preload.js
const { contextBridge, shell } = require("electron");

console.log("✅ preload loaded");

contextBridge.exposeInMainWorld("electronAPI", {
    openExternal: (url) => {
        console.log("✅ openExternal called:", url);
        shell.openExternal(url);
    },
});
// ✅ Expose environment variables (from main.js via process.env)
contextBridge.exposeInMainWorld("env", {
    API_URL: process.env.REACT_APP_API_URL || "http://192.168.18.89:5000/api",
});
