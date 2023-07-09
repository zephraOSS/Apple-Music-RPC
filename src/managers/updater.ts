import { app } from "electron";
import { autoUpdater } from "electron-updater";

import { bounce } from "../utils/functions";
import { Browser } from "./browser";
import { config } from "./store";

import * as log from "electron-log";

export function init() {
    if (
        !app.isPackaged ||
        process.windowsStore ||
        process.platform === "darwin"
    )
        return;

    autoUpdater.allowPrerelease = config.get("betaUpdates");

    autoUpdater.on("update-available", (info) => {
        log.info(
            "[UPDATER]",
            ` Update available (${info.version})`,
            `Auto Update: ${config.get("autoUpdate")}`
        );

        if (config.get("autoUpdate")) {
            autoUpdater.downloadUpdate().then((r) => {
                log.info("[UPDATER]", "Downloading update...", r);
            });
        } else {
            if (process.platform === "darwin") bounce("critical");
            else Browser.windowAction("show");

            Browser.send("new-update-available", true, {
                version: info.version
            });
        }
    });

    autoUpdater.on("update-not-available", () => {
        log.info("[UPDATER] No updates available");
    });

    autoUpdater.on("error", (err) => {
        log.error("[UPDATER]", `${err}`);
    });

    autoUpdater.on("download-progress", (progressObj) => {
        if (
            progressObj.percent === 25 ||
            progressObj.percent === 50 ||
            progressObj.percent === 75 ||
            progressObj.percent === 100
        )
            log.info(
                "[UPDATER]",
                `Downloading update... (${progressObj.percent}%)`
            );

        Browser.send("update-download-progress-update", true, {
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total,
            speed: progressObj.bytesPerSecond
        });
    });

    autoUpdater.on("update-downloaded", (info) => {
        log.info("[UPDATER]", `Update downloaded (${info.version})`);

        if (process.platform === "darwin") bounce("critical");
        else Browser.windowAction("show");

        Browser.send("update-downloaded", true, {});
    });

    checkForUpdates();

    setInterval(checkForUpdates, 1.8e6);

    log.info("[UPDATER]", "AutoUpdater initialized");
}

export function checkForUpdates() {
    log.log("[UPDATER]", "Checking for Updates...");

    autoUpdater.checkForUpdatesAndNotify();
}

export function installAppUpdate() {
    log.info("[UPDATER]", " Installing update...");

    autoUpdater.quitAndInstall();
}
