import { app, ipcMain, nativeTheme, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { getAppData, getConfig, setAppData, setConfig } from "./store";
import { init as initAutoLaunch } from "./launch";
import { Browser } from "./browser";

export function init() {
    ipcMain.handle("update-download", (_e, install) => {
        if (install) setAppData("installUpdate", true);

        autoUpdater.downloadUpdate();
    });

    ipcMain.handle("update-install", () => {
        setAppData("installUpdate", undefined);

        autoUpdater.quitAndInstall();
    });

    ipcMain.handle("autolaunch-change", () => {
        initAutoLaunch();
    });

    ipcMain.handle("appVersion", () => {
        return app.getVersion();
    });

    ipcMain.handle("getPlatform", () => {
        return process.platform;
    });

    ipcMain.handle("isDeveloper", () => {
        return !app.isPackaged;
    });

    ipcMain.handle("getSystemTheme", () => {
        return nativeTheme.shouldUseDarkColors ? "dark" : "light";
    });

    ipcMain.handle("getConfig", (_e, k: string) => {
        return getConfig(k);
    });

    ipcMain.handle("getAppData", (_e, k: string) => {
        return getAppData(k);
    });

    ipcMain.handle("updateLanguage", (_e, language) => {
        console.log(`[Backend] Changed language to ${language}`);

        /*app.langString = require(`../language/${language}.json`);*/
    });

    ipcMain.handle("updateConfig", (_e, k: string, v: any) => setConfig(k, v));

    ipcMain.handle("updateAppData", (_e, k: string, v: any) =>
        setAppData(k, v)
    );

    ipcMain.handle("windowControl", (_e, action: string) => {
        Browser.windowAction(action);
    });

    ipcMain.handle("appControl", (_e, action) => {
        if (action === "restart") {
            app.relaunch();
            app.exit();
        }
    });

    ipcMain.handle("openURL", (_e, url) => {
        if (
            !url.startsWith("https://") &&
            !url.startsWith("http://") &&
            !url.startsWith("amrpc://") &&
            !url.startsWith("mailto:")
        )
            return;

        shell.openExternal(url);
    });
}
