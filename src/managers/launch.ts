import { app } from "electron";
import { getConfig } from "./store";
import { getMicrosoftAppInfo } from "../utils/getMicrosoftAppInfo";

import AutoLaunch from "auto-launch";

import * as log from "electron-log";
import * as path from "path";

export function init() {
    if (!app.isPackaged) return;

    if (process.windowsStore) {
        const info = getMicrosoftAppInfo();

        if (!info)
            return log.warn(
                "[AutoLaunch]",
                "Could not find Microsoft Store app info"
            );

        const explorerExePath = path.join("C:", "Windows", "explorer.exe"),
            appPath = path.join(
                "shell:AppsFolder",
                info as string,
                "AMRPC.exe"
            );

        const autoLaunch = new AutoLaunch({
            name: "AMRPC",
            path: `${explorerExePath} ${appPath}`
        });

        if (getConfig("autoLaunch")) autoLaunch.enable();
        else autoLaunch.disable();

        log.info("[AutoLaunch][Windows-Store]", "AutoLaunch initialized");
    } else {
        const autoLaunch = new AutoLaunch({
            name: "AMRPC",
            path: app.getPath("exe")
        });

        if (getConfig("autoLaunch")) autoLaunch.enable();
        else autoLaunch.disable();

        log.info("[AutoLaunch]", "AutoLaunch initialized");
    }
}
