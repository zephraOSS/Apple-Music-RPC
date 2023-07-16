import { app, ipcMain, nativeTheme, shell } from "electron";
import { appData, cache, config } from "./store";
import { Browser } from "./browser";
import { Discord } from "./discord";
import { i18n } from "./i18n";

import { useDarkMode } from "../utils/theme";
import { appDependencies, updater, setLastFM } from "../index";

import { init as initAutoLaunch } from "./launch";

import * as log from "electron-log";
import * as fs from "fs";

import fetch from "node-fetch";

export function init() {
    ipcMain.on("update-download", (_e, install) => {
        if (install) appData.set("installUpdate", true);

        updater.downloadUpdate();
    });

    ipcMain.on("update-install", updater.installUpdate);

    ipcMain.handle("autolaunch-change", () => {
        initAutoLaunch();
    });

    ipcMain.handle("appVersion", () => {
        return app.getVersion();
    });

    ipcMain.handle("getPlatform", () => {
        return process.platform;
    });

    ipcMain.handle("isWindowsStore", () => {
        return process.windowsStore;
    });

    ipcMain.handle("isDeveloper", () => {
        return !app.isPackaged;
    });

    ipcMain.handle("isSupporter", () => {
        return appDependencies?.discord
            ? Discord.instance?.isSupporter ?? false
            : false;
    });

    ipcMain.handle("getLanguages", () => {
        return i18n.getLanguages();
    });

    ipcMain.handle("getLangStrings", () => {
        return i18n.getLangStrings();
    });

    ipcMain.handle("getSystemTheme", () => {
        return nativeTheme.shouldUseDarkColors ? "dark" : "light";
    });

    ipcMain.handle("getTheme", () => {
        const colorTheme = config.get("colorTheme");

        if (colorTheme === "auto") return useDarkMode() ? "dark" : "light";
        else if (colorTheme === "os")
            return nativeTheme.shouldUseDarkColors ? "dark" : "light";
        else return colorTheme;
    });

    ipcMain.handle("getCurrentTrack", () => {
        if (
            !appDependencies.discord ||
            !Discord.instance ||
            !Discord.instance.currentTrack
        )
            return { artwork: null, playerState: null };

        return {
            artwork: Discord.instance.currentTrack.artwork ?? null,
            playerState: Discord.instance.currentTrack.playerState ?? "stopped"
        };
    });

    ipcMain.handle("getConfig", (_e, k: string) => {
        return config.get(k);
    });

    ipcMain.handle("resetConfig", (_e, k: string) => {
        // @ts-ignore
        config.reset(k);

        return config.get(k);
    });

    ipcMain.handle("getAppData", (_e, k: string) => {
        return appData.get(k);
    });

    ipcMain.handle("updateConfig", (_e, k: string, v: any) => {
        if (
            k === "rpcLargeImageText" &&
            (!appDependencies.discord ||
                !Discord.instance ||
                (appDependencies.discord && !Discord.instance.isSupporter))
        ) {
            return log.warn(
                "[IPC][UPDATE_CONFIG]",
                `User is not a supporter, cannot change large image text (isSupporter: ${Discord.instance?.isSupporter})`
            );
        }

        if (k === "enableCache" && !v) cache.clear();

        config.set(k, v);
    });

    ipcMain.handle("updateAppData", (_e, k: string, v: any) =>
        appData.set(k, v)
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

    ipcMain.handle("fetchChangelog", async () => {
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

    ipcMain.handle("fetchCacheSize", () => {
        if (!fs.existsSync(cache.path)) {
            log.info("[IPC][fetchCacheSize]", "Cache file does not exist");

            return { size: 0, fileSize: 0 };
        }

        return {
            size: cache.size,
            fileSize: fs.statSync(cache.path).size / (1024 * 1024)
        };
    });

    ipcMain.handle("songDataFeedback", (_e, _isPositive) => {
        if (!appDependencies.discord || !Discord.instance) return;

        // @ts-ignore
        const songDataHistory = Discord.instance.songData.history;

        // TODO: Get current song data and send feedback to the API :: Paused until new website is released
    });

    ipcMain.handle("isReady", (_e, isReady: boolean) => {
        Browser.setReady(isReady);
    });

    ipcMain.handle("checkAppDependencies", () => {
        return appDependencies;
    });

    // Last.fm
    ipcMain.handle("lastfm-getUser", () => {
        return config.get("lastFM");
    });

    ipcMain.handle("lastfm-connect", (_e, connect: boolean = false) => {
        setLastFM(connect);
    });

    // Button actions
    ipcMain.handle("resetCache", () => {
        cache.clear();
    });
}
