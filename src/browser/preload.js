const { contextBridge, ipcRenderer, shell } = require("electron"),
    fetch = require("fetch").fetchUrl;

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
        set: (k, v) => {
            return ipcRenderer.invoke("updateAppData", k, v);
        },
        get: (k) => {
            return ipcRenderer.invoke("getAppData", k);
        }
    },
    config: {
        set: (k, v) => {
            return ipcRenderer.invoke("updateConfig", k, v);
        },
        get: (k) => {
            return ipcRenderer.invoke("getConfig", k);
        }
    },
    installAMEPlugin: async () => {
        return await ipcRenderer.invoke("installAMEPlugin");
    },
    fetchChangelog: () => {
        return new Promise((resolve, reject) => {
            fetch(
                "https://api.github.com/repos/ZephraCloud/Apple-Music-RPC/releases/latest",
                {
                    cache: "no-store"
                },
                (error, meta, body) => {
                    if (error) return reject(error);
                    body = JSON.parse(body.toString());

                    resolve(body);
                }
            );
        });
    },
    updateLanguage: (lang) => ipcRenderer.invoke("updateLanguage", lang),
    openURL: (url) => {
        if (url.startsWith("http://"))
            return console.log(
                "[BROWSER PRELOAD] Didn't open URL because it's not secure."
            );

        shell.openExternal(url);
    },
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
            ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
});
