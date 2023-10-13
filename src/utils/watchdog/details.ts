import fs from "fs";
import path from "path";

import getAppDataPath from "../getAppDataPath";
import execPromise from "../execPromise";

export function WatchDogDetails(
    type: "version" | "status" | "running"
): string | boolean | Promise<boolean> | null {
    const appData = getAppDataPath(),
        appDataWatchDog = path.join(appData, "/watchdog/");

    if (type === "version") {
        if (
            !appData ||
            !fs.existsSync(path.join(appDataWatchDog, "version.txt"))
        )
            return null;

        return fs.readFileSync(
            path.join(appDataWatchDog, "version.txt"),
            "utf-8"
        );
    } else if (type === "status") {
        if (!appData) return null;

        return (
            fs.existsSync(appDataWatchDog) &&
            fs.existsSync(path.join(appDataWatchDog, "watchdog.exe")) &&
            fs.existsSync(path.join(appDataWatchDog, "Newtonsoft.Json.dll")) &&
            fs.existsSync(path.join(appDataWatchDog, "websocket-sharp.dll"))
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
