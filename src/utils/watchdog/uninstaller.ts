import { WatchDogDetails } from "./details";

import fs from "fs";
import path from "path";

import getAppDataPath from "../getAppDataPath";

import * as log from "electron-log";

export function WatchDogUninstaller() {
    if (!WatchDogDetails("status")) return;

    const appData = path.join(getAppDataPath(), "/watchdog/");

    if (!fs.existsSync(appData)) return;

    log.info("[WatchDogUninstaller]", "Deleting WatchDog files");

    fs.readdirSync(appData).forEach((file) => {
        fs.unlinkSync(path.join(appData, file));
    });

    fs.rmdirSync(appData);

    log.info("[WatchDogUninstaller]", "Deleted WatchDog files");
}
