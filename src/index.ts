import { app, nativeTheme } from "electron";
import { TrayManager } from "./managers/tray";
//import { createRoom } from "./managers/listenTogether";
import { getConfig } from "./managers/store";
import { Browser } from "./managers/browser";

import { init as initSentry } from "./managers/sentry";
import { init as initAutoLaunch } from "./managers/launch";
import { init as initAutoUpdater } from "./managers/updater";
import { init as initITunes } from "./managers/itunes";
import { init as initTheme } from "./utils/theme";

import * as log from "electron-log";

export let trayManager: TrayManager;

if (!app.requestSingleInstanceLock()) app.quit();

initSentry();

app.on("ready", () => {
    trayManager = new TrayManager();

    initTheme();
    initAutoLaunch();
    initAutoUpdater();
    initITunes();
    //createRoom();

    nativeTheme.on("updated", () => {
        log.info(
            `[Backend] Theme changed to ${
                nativeTheme.shouldUseDarkColors ? "dark" : "light"
            }`
        );

        if (getConfig("colorTheme") === "os") {
            Browser.send("update-system-theme", false, {
                theme: nativeTheme.shouldUseDarkColors ? "dark" : "light"
            });
        }
    });
});
