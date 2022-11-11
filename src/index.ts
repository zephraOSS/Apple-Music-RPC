import { app, nativeTheme } from "electron";
import { TrayManager } from "./managers/tray";
import { ModalWatcher } from "./managers/modal";
import { Browser } from "./managers/browser";
import { getConfig } from "./managers/store";

import { init as initSentry } from "./managers/sentry";
import { init as initAutoLaunch } from "./managers/launch";
import { init as initAutoUpdater } from "./managers/updater";
import { init as initITunes } from "./managers/bridge";
import { init as initTheme } from "./utils/theme";

import * as log from "electron-log";

export let trayManager: TrayManager;
export let modalWatcher: ModalWatcher;

if (!app.requestSingleInstanceLock()) app.quit();

initSentry();

app.on("ready", () => {
    trayManager = new TrayManager();
    modalWatcher = new ModalWatcher();

    initTheme();
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
            Browser.send("update-system-theme", false, {
                theme: nativeTheme.shouldUseDarkColors ? "dark" : "light"
            });
        }
    });
});
