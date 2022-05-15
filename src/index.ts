import { app, nativeTheme } from "electron";
import { TrayManager } from "./managers/tray";
import { init as initSentry } from "./managers/sentry";
import { init as initAutoLaunch } from "./managers/launch";
import { init as initAutoUpdater } from "./managers/updater";
import { getConfig } from "./managers/store";
import { Browser } from "./managers/browser";
import { init as initITunes } from "./managers/itunes";
import * as log from "electron-log";

export let trayManager: TrayManager;

if (!app.requestSingleInstanceLock()) app.quit();

initSentry();

app.on("ready", () => {
    trayManager = new TrayManager();

    initAutoLaunch();
    initAutoUpdater();
    initITunes();

    nativeTheme.on("updated", () => {
        log.info(
            `[Backend] Theme changed to ${
                nativeTheme.shouldUseDarkColors ? "dark" : "light"
            }`
        );

        if (getConfig("colorTheme") === "os") {
            Browser.send("update-system-theme", {
                theme: nativeTheme.shouldUseDarkColors ? "dark" : "light"
            });
        }
    });
});
