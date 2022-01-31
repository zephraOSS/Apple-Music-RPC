const {
        ipcMain,
        app,
        Menu,
        Notification,
        Tray,
        BrowserWindow,
        nativeTheme,
    } = require("electron"),
    path = require("path"),
    { autoUpdater } = require("electron-updater"),
    AutoLaunch = require("auto-launch"),
    { connect } = require("../managers/discord.js"),
    { installAMEPlugin } = require("../utils/plugin.js"),
    functions = require("../utils/functions.js");

let langString = require(`../language/${app.config.get("language")}.json`);

console.log = app.addLog;

if (!app.config.get("hardwareAcceleration")) app.disableHardwareAcceleration();

if (process.platform === "darwin") app.dock.hide();

app.on("ready", () => {
    console.log("[APP] Starting...");

    let tray = new Tray(
            path.join(
                app.getAppPath(),
                `assets/icons/${process.platform ?? "win32"}/logo.png`
            )
        ),
        autoLaunch = new AutoLaunch({
            name: app.dev ? "AMRPC - DEV" : "AMRPC",
            path: app.getPath("exe"),
        }),
        cmenu = Menu.buildFromTemplate([
            {
                label: `${
                    app.dev ? "AMRPC - DEV" : "AMRPC"
                } V.${app.getVersion()}`,
                icon: path.join(app.getAppPath(), "assets/tray/logo@18.png"),
                enabled: false,
            },
            {
                label:
                    app.config.get("service") === "ame"
                        ? "Apple Music Electron"
                        : process.platform === "darwin" ? "iTunes / Apple Music" : "iTunes",
                enabled: false,
            },
            { type: "separator" },
            {
                label: langString.tray.restart,
                click() {
                    app.restart();
                },
            },
            {
                label: langString.tray.checkForUpdates,
                click() {
                    app.checkForUpdates();
                },
            },
            { type: "separator" },
            {
                label: langString.tray.openSettings,
                click() {
                    app.mainWindow.show();
                },
            },
            { type: "separator" },
            {
                label: langString.tray.quit,
                click() {
                    (app.isQuiting = true), app.quit();
                },
            },
        ]);

    app.on("quit", () => tray.destroy());
    app.on("before-quit", function () {
        app.isQuiting = true;
    });

    tray.setToolTip(app.dev ? "AMRPC - DEV" : "AMRPC");
    tray.setContextMenu(cmenu);
    tray.on("right-click", () => tray.update());
    tray.on("click", () => app.mainWindow.show());

    if (app.config.get("autolaunch")) autoLaunch.enable();
    else autoLaunch.disable();

    app.mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(app.getAppPath(), "browser/preload.js"),
        },
        icon: path.join(app.getAppPath(), "assets/logo.png"),
        frame: false,
        resizable: false,
        devTools: app.dev,
    });

    app.mainWindow.loadFile(path.join(app.getAppPath(), "browser/index.html"));

    app.mainWindow.on("close", function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            app.mainWindow.hide();

            return false;
        }
    });

    autoUpdater.on("update-available", (info) => {
        console.log(`[UPDATER] Update available (${info.version})`);

        if (process.platform === "darwin") functions.bounce("critical");
        else app.mainWindow.show();

        app.sendToMainWindow("new-update-available", {
            version: info.version,
        });
    });

    autoUpdater.on("update-not-available", (info) => {
        console.log("[UPDATER] No updates available");
    });

    autoUpdater.on("error", (err) => {
        console.log(`[UPDATER] Error in auto-updater. ${err}`);
    });

    autoUpdater.on("download-progress", (progressObj) => {
        if (
            progressObj.percent === 25 ||
            progressObj.percent === 50 ||
            progressObj.percent === 75 ||
            progressObj.percent === 100
        )
            console.log(
                `[UPDATER] Downloading update... (${progressObj.percent}%)`
            );

        app.sendToMainWindow("update-download-progress-update", {
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total,
            speed: progressObj.bytesPerSecond,
        });
    });

    autoUpdater.on("update-downloaded", (info) => {
        console.log(`[UPDATER] Update downloaded (${info.version})`);

        if (process.platform === "darwin") functions.bounce("critical");
        else app.mainWindow.show();

        app.sendToMainWindow("update-downloaded", {});

        if (app.appData.get("installUpdate")) autoUpdater.quitAndInstall();
    });

    ipcMain.handle("update-download", (e, install) => {
        if (install) app.appData.set("installUpdate", true);

        autoUpdater.downloadUpdate();
    });

    ipcMain.handle("update-install", (e) => {
        app.appData.delete("installUpdate");

        autoUpdater.quitAndInstall();
    });

    ipcMain.handle("autolaunch-change", (e, d) => {
        if (app.config.get("autolaunch")) autoLaunch.enable();
        else autoLaunch.disable();

        console.log(
            `[SETTINGS] Autolaunch is now ${
                app.config.get("autolaunch") ? "enabled" : "disabled"
            }`
        );
    });

    ipcMain.handle("appVersion", () => {
        return app.getVersion();
    });

    ipcMain.handle("getPlatform", () => {
        return process.platform;
    });

    ipcMain.handle("isDeveloper", () => {
        return app.dev;
    });

    ipcMain.handle("getSystemTheme", () => {
        return nativeTheme.shouldUseDarkColors ? "dark" : "light";
    });

    ipcMain.handle("getConfig", (e, k) => {
        return app.config.get(k);
    });

    ipcMain.handle("getAppData", (e, k) => {
        return app.appData.get(k);
    });

    ipcMain.handle("installAMEPlugin", () => {
        return installAMEPlugin();
    });

    ipcMain.handle("updateLanguage", (e, language) => {
        console.log(`[Backend] Changed language to ${language}`);

        app.langString = require(`../language/${language}.json`);
    });

    ipcMain.handle("updateConfig", (e, k, v) => app.config.set(k, v));

    ipcMain.handle("updateAppData", (e, k, v) => app.appData.set(k, v));

    ipcMain.handle("windowControl", (e, action) => {
        if (action === "show") app.mainWindow.show();
        else if (action === "hide") app.mainWindow.hide();
        else if (action === "close") app.mainWindow.close();
        else if (action === "minimize") app.mainWindow.minimize();
        else if (action === "maximize") app.mainWindow.maximize();
        else if (action === "reload") app.mainWindow.reload();
    });

    ipcMain.handle("appControl", (e, action) => {
        if (action === "restart") app?.restart();
    });

    nativeTheme.on("updated", () => {
        console.log(
            `[Backend] Theme changed to ${
                nativeTheme.shouldUseDarkColors ? "dark" : "light"
            }`
        );

        if (app.config.get("colorTheme") === "os") {
            app.mainWindow.webContents.send("update-system-theme", {
                theme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
            });
        }
    });

    app.mainWindow.hide();
    app.checkForUpdates();
    connect();

    setInterval(() => {
        app.checkForUpdates();
    }, 600e3);

    console.log("[APP] Ready");
});

app.checkForUpdates = () => {
    console.log("[UPDATER] Checking for Updates...");
    autoUpdater.checkForUpdatesAndNotify();
};

app.sendToMainWindow = (t, v) => {
    app.mainWindow.webContents.send(t, v);
};

app.showNotification = (title, body) => {
    new Notification({
        title: title,
        body: body,
        icon: path.join(app.getAppPath(), "assets/logo.png"),
    }).show();
};

app.restart = () => {
    app.relaunch();
    app.exit();
};

function isEqual(obj1, obj2) {
    const obj1Keys = Object.keys(obj1),
        obj2Keys = Object.keys(obj2);

    if (obj1Keys.length !== obj2Keys.length) return false;

    for (let objKey of obj1Keys) {
        if (obj1[objKey] !== obj2[objKey]) {
            if (
                typeof obj1[objKey] == "object" &&
                typeof obj2[objKey] == "object"
            ) {
                if (!isEqual(obj1[objKey], obj2[objKey])) return false;
            } else return false;
        }
    }

    return true;
}
