import fs from "fs";
import path from "path";

import getAppDataPath from "../getAppDataPath";
import execPromise from "../execPromise";

export function WatchDogDetails(
    type: "version" | "status" | "running"
): string | boolean | Promise<boolean> | null {
    const appData = getAppDataPath(),
        appDataWatchdog = path.join(appData, "/watchdog/");

    if (type === "version") {
        if (!appData || !fs.existsSync(path.join(appData, "version.txt")))
            return null;

        return fs.readFileSync(path.join(appData, "version.txt"), "utf-8");
    } else if (type === "status") {
        if (!appData) return null;

        return (
            fs.existsSync(appDataWatchdog) &&
            fs.existsSync(path.join(appDataWatchdog, "watchdog.exe")) &&
            fs.existsSync(path.join(appDataWatchdog, "watchdog.pdb")) &&
            fs.existsSync(path.join(appDataWatchdog, "watchdog.exe.config"))
        );
    } else if (type === "running") {
        if (!appData) return null;

        return new Promise((resolve) => {
            execPromise("tasklist").then((res) => {
                resolve(res.includes("watchdog.exe"));
            });
        });
    }
}
