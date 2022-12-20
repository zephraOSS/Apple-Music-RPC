import { app } from "electron";
import { getConfig } from "./store";

import AutoLaunch from "auto-launch";

import * as log from "electron-log";
import * as path from "path";

export function init() {
    if (!app.isPackaged) return;

    const logNote = process.windowsStore
        ? "[AutoLaunch][Windows-Store]"
        : "[AutoLaunch]";

    const paths = {
        explorer: path.join("C:", "Windows", "explorer.exe"),
        app: path.join(
            "shell:AppsFolder",
            "62976zephra.AMRPC_xe0z77jsegffp!62976zephra.AMRPC"
        )
    };

    const autoLaunch = new AutoLaunch({
        name: "AMRPC",
        path: process.windowsStore
            ? `${paths.explorer} ${paths.app}`
            : app.getPath("exe")
    });

    autoLaunch[getConfig("autoLaunch") ? "enable" : "disable"]().catch(
        (err) => {
            log.warn(`${logNote}[Error]`, err);
        }
    );

    log.info(logNote, "AutoLaunch initialized");
}
