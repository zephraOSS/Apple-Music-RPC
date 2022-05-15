import { contextBridge, ipcRenderer } from "electron";
import { fetchUrl as fetch } from "fetch";

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
    getLangStrings: (lang) => {
        return require(`../language/${lang}.json`);
    },
    getSystemTheme: () => {
        return ipcRenderer.invoke("getSystemTheme", {});
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
        }
    },
    fetchChangelog: () => {
        return new Promise((resolve, reject) => {
            fetch(
                "https://api.github.com/repos/ZephraCloud/Apple-Music-RPC/releases/latest",
                {
                    cache: "no-store"
                },
                (error, _meta, body) => {
                    if (error) return reject(error);
                    body = JSON.parse(body.toString());

                    resolve(body);
                }
            );
        });
    },
    updateLanguage: (lang) => ipcRenderer.invoke("updateLanguage", lang),
    openURL: (url) => ipcRenderer.invoke("openURL", url),
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
            "update-downloaded"
        ];

        if (validChannels.includes(channel))
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
});
