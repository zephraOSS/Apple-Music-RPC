import { app } from "electron";
import { getConfig } from "./store";
import AutoLaunch from "auto-launch";
import * as log from "electron-log";

export function init() {
    if (!app.isPackaged) return;

    const autoLaunch = new AutoLaunch({
        name: app.isPackaged ? "AMRPC" : "AMRPC - DEV",
        path: app.getPath("exe")
    });

    if (getConfig("autoLaunch")) autoLaunch.enable();
    else autoLaunch.disable();

    log.info("[AUTOLAUNCH]", "AutoLaunch initialized");
}
