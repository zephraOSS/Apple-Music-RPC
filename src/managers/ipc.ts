import { app, ipcMain, nativeTheme, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { getAppData, getConfig, setAppData, setConfig } from "./store";
import { init as initAutoLaunch } from "./launch";
import { Browser } from "./browser";
import { Discord } from "./discord";
import { useDarkMode } from "../utils/theme";

import * as log from "electron-log";

import fetch from "node-fetch";

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

    ipcMain.handle("isSupporter", () => {
        return Discord.instance.isSupporter;
    });

    ipcMain.handle("getLangStrings", (_e, lang: string) => {
        return require(`../language/${lang}.json`);
    });

    ipcMain.handle("getSystemTheme", () => {
        return nativeTheme.shouldUseDarkColors ? "dark" : "light";
    });

    ipcMain.handle("getTheme", () => {
        const config = getConfig("colorTheme");

        if (config === "auto") return useDarkMode() ? "dark" : "light";
        else if (config === "os")
            return nativeTheme.shouldUseDarkColors ? "dark" : "light";
        else return config;
    });

    ipcMain.handle("getCurrentTrack", () => {
        return {
            artwork: Discord.instance.currentTrack.artwork,
            playerState: Discord.instance.currentTrack.playerState
        };
    });

    ipcMain.handle("getConfig", (_e, k: string) => {
        return getConfig(k);
    });

    ipcMain.handle("getAppData", (_e, k: string) => {
        return getAppData(k);
    });

    ipcMain.handle("updateLanguage", (_e, language) => {
        log.info(`[Backend] Changed language to ${language}`);

        /*app.langString = require(`../language/${language}.json`);*/
    });

    ipcMain.handle("updateConfig", (_e, k: string, v: any) => {
        if (k === "rpcLargeImageText" && !Discord.instance.isSupporter)
            return log.warn(
                "[IPC][UPDATE_CONFIG]",
                `User is not a supporter, cannot change large image text (isSupporter: ${Discord.instance.isSupporter})`
            );

        setConfig(k, v);
    });

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

    ipcMain.handle("fetchChangelog", async (_e) => {
        const res = await fetch(
            "https://api.github.com/repos/ZephraCloud/Apple-Music-RPC/releases/latest",
            {
                cache: "no-store"
            }
        );

        return await res.json();
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
