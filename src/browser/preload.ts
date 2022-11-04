import { contextBridge, ipcRenderer } from "electron";

console.log("[BROWSER PRELOAD] Ready");

contextBridge.exposeInMainWorld("electron", {
    appVersion: async () => {
        return await ipcRenderer.invoke("appVersion");
    },
    getPlatform: async () => {
        return await ipcRenderer.invoke("getPlatform");
    },
    isDeveloper: async () => {
        return await ipcRenderer.invoke("isDeveloper");
    },
    isSupporter: async () => {
        return await ipcRenderer.invoke("isSupporter");
    },
    getLangStrings: (lang) => {
        return ipcRenderer.invoke("getLangStrings", lang);
    },
    getSystemTheme: () => {
        return ipcRenderer.invoke("getSystemTheme", {});
    },
    getTheme: () => {
        return ipcRenderer.invoke("getTheme", {});
    },
    getCurrentTrack: () => {
        return ipcRenderer.invoke("getCurrentTrack", {});
    },
    appData: {
        set: (k, v) => ipcRenderer.invoke("updateAppData", k, v),
        get: (k) => {
            return ipcRenderer.invoke("getAppData", k);
        }
    },
    config: {
        set: (k, v) => ipcRenderer.invoke("updateConfig", k, v),
        get: (k) => {
            return ipcRenderer.invoke("getConfig", k);
        },
        reset: (k) => {
            return ipcRenderer.invoke("resetConfig", k);
        }
    },
    fetchChangelog: async () => {
        return await ipcRenderer.invoke("fetchChangelog");
    },
    openURL: (url: string) => {
        if (
            !url.startsWith("https://") &&
            !url.startsWith("http://") &&
            !url.startsWith("mailto:")
        )
            return;

        ipcRenderer.invoke("openURL", url);
    },
    updateLanguage: (lang) => ipcRenderer.invoke("updateLanguage", lang),
    minimize: () => ipcRenderer.invoke("windowControl", "minimize"),
    maximize: () => ipcRenderer.invoke("windowControl", "maximize"),
    hide: () => ipcRenderer.invoke("windowControl", "hide"),
    reload: () => ipcRenderer.invoke("windowControl", "reload"),
    restart: () => ipcRenderer.invoke("appControl", "restart")
});

contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        const validChannels = ["update-download", "update-install"];

        if (validChannels.includes(channel)) ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        const validChannels = [
            "update-system-theme",
            "new-update-available",
            "update-download-progress-update",
            "update-downloaded",
            "get-current-track",
            "open-modal"
        ];

        if (validChannels.includes(channel))
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
});

ipcRenderer.invoke("isReady", true);
