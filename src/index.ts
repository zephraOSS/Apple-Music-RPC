import { app, nativeTheme } from "electron";

import { appData, config } from "./managers/store";

import { TrayManager } from "./managers/tray";
import { ModalWatcher } from "./managers/modal";
import { Bridge } from "./managers/bridge";
import { Browser } from "./managers/browser";
import { LastFM } from "./managers/lastFM";
import { Updater } from "./managers/updater";

import { init as initSentry } from "./managers/sentry";
import { init as initAutoLaunch } from "./managers/launch";
import { init as initTheme } from "./utils/theme";
import { init as initMsStoreModal } from "./utils/msStoreModal";
import { init as initCrowdin } from "./utils/crowdin";
import { init as initProtocol } from "./utils/protocol";

import { checkAppDependency } from "./utils/checkAppDependency";

import * as log from "electron-log";

export const isBeta = app.getVersion().includes("beta"),
    isRC = app.getVersion().includes("rc");

export let trayManager: TrayManager;
export let modalWatcher: ModalWatcher;
export let appDependencies: AppDependencies;
export let lastFM: LastFM;
export let bridge: Bridge;
export let updater: Updater;

Object.assign(console, log.functions);

if (!app.isPackaged) log.transports.file.fileName = "development.log";
if (!app.requestSingleInstanceLock()) app.quit();

log.info(
    "------------------------------------",
    `STARTING - ${app.getVersion()}`,
    "------------------------------------"
);

if (isBeta) {
    log.info("[STARTUP]", "Detected beta build. Enabling beta updates");
    config.set("betaUpdates", true);
}

if (isRC) log.info("[STARTUP]", "Detected release candidate build");
if (process.windowsStore) log.info("[STARTUP]", "Detected Windows Store build");

initSentry();
initProtocol();

appData.set("installUpdate", false);

if (process.platform !== "win32") {
    config.set("autoUpdates", false);
    config.set("betaUpdates", false);
}

app.on("ready", async () => {
    await initCrowdin().catch((err) => log.error("[READY][initCrowdin]", err));

    trayManager = new TrayManager();
    modalWatcher = new ModalWatcher();
    updater = new Updater();
    appDependencies = await checkAppDependency();

    if (
        config.get("enableLastFM") &&
        config.get("lastFM.username") &&
        config.get("lastFM.key")
    )
        lastFM = new LastFM();

    initTheme();
    initAutoLaunch();
    initMsStoreModal();

    if (appDependencies.music && appDependencies.discord) bridge = new Bridge();
    else Browser.windowAction("show");

    nativeTheme.on("updated", () => {
        log.info(
            `[Backend] Theme changed to ${
                nativeTheme.shouldUseDarkColors ? "dark" : "light"
            }`
        );

        if (config.get("colorTheme") === "os") {
            Browser.send("update-system-theme", false, {
                theme: nativeTheme.shouldUseDarkColors ? "dark" : "light"
            });
        }
    });
});

export function setLastFM(connect: boolean) {
    lastFM = new LastFM(connect);
}
