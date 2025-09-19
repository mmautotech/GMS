// src/preload.js
const { contextBridge, shell } = require("electron");

console.log("✅ preload loaded");

contextBridge.exposeInMainWorld("electronAPI", {
    openExternal: (url) => {
        console.log("✅ openExternal called:", url);
        shell.openExternal(url);
    },
});
