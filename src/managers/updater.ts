import { autoUpdater } from "electron-updater";

import { Browser } from "./browser";
import { appData, config } from "./store";

import * as log from "electron-log";

export class Updater {
    private userNotified: Boolean | string = false;

    constructor() {
        log.info("[UPDATER]", "Updater initialized");

        autoUpdater.allowPrerelease = config.get("betaUpdates");
        autoUpdater.autoDownload = false;

        autoUpdater.on("update-available", (info) => {
            log.info(
                "[UPDATER]",
                `Update available (${info.version})`,
                `Auto Update: ${config.get("autoUpdate")}`,
                `Beta Updates: ${config.get("betaUpdates")}`
            );

            if (config.get("autoUpdate") && process.platform === "win32")
                this.downloadUpdate();
            else if (!this.userNotified) {
                Browser.send("new-update-available", true, {
                    version: info.version
                });

                this.userNotified = true;
            }
        });

        autoUpdater.on("error", (err) => log.error("[UPDATER]", err));

        autoUpdater.on("download-progress", (progressObj) => {
            if (
                progressObj.percent === 25 ||
                progressObj.percent === 50 ||
                progressObj.percent === 75 ||
                progressObj.percent === 100
            ) {
                log.info(
                    "[UPDATER]",
                    `Downloading update... (${progressObj.percent}%)`
                );
            }

            Browser.send("update-download-progress-update", true, {
                percent: progressObj.percent,
                transferred: progressObj.transferred,
                total: progressObj.total,
                speed: progressObj.bytesPerSecond
            });
        });

        autoUpdater.on("update-downloaded", (info) => {
            log.info("[UPDATER]", `Update downloaded (${info.version})`);

            if (appData.get("installUpdate")) this.installUpdate();
            else Browser.send("update-downloaded", true, {});
        });

        setInterval(() => {
            this.checkForUpdates();
        }, 1.8e6);

        this.checkForUpdates();
    }

    public checkForUpdates() {
        log.info("[UPDATER]", "Checking for Updates...");

        autoUpdater[
            this.userNotified ? "checkForUpdates" : "checkForUpdatesAndNotify"
        ]().then(() => log.info("[UPDATER]", "Update check completed"));
    }

    public downloadUpdate() {
        log.info("[UPDATER]", "Update download initiated");

        autoUpdater
            .downloadUpdate()
            .then((r) => {
                log.info("[UPDATER]", "Downloading update...", r);
            })
            .catch((err) => {
                log.error("[UPDATER]", "Error downloading update", err);
            });
    }

    public installUpdate() {
        log.info("[UPDATER]", "Installing update... (Quiting)");

        autoUpdater.quitAndInstall();
    }
}
