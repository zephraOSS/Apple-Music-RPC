import { app } from "electron";
import { getConfig } from "./store";
import { checkIfMSStore } from "../utils/checkIfMSStore";
import { WindowsStoreAutoLaunch } from "electron-winstore-auto-launch";

import AutoLaunch from "auto-launch";

import * as log from "electron-log";

export function init() {
    if (!app.isPackaged) return;

    if (checkIfMSStore()) {
        if (getConfig("autoLaunch") && !WindowsStoreAutoLaunch.getStatus())
            WindowsStoreAutoLaunch.enable();
        else if (WindowsStoreAutoLaunch.getStatus())
            WindowsStoreAutoLaunch.disable();

        log.info("[AUTOLAUNCH][WINDOWS-STORE]", "AutoLaunch initialized");
    } else {
        const autoLaunch = new AutoLaunch({
            name: "AMRPC",
            path: app.getPath("exe")
        });

        if (getConfig("autoLaunch")) autoLaunch.enable();
        else autoLaunch.disable();

        log.info("[AUTOLAUNCH]", "AutoLaunch initialized");
    }
}
