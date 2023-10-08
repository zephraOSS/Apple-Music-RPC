import { WatchDogDetails, WatchDogState } from "./";
import { watchDog } from "../../index";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import decompress from "decompress";

import getAppDataPath from "../getAppDataPath";

import * as log from "electron-log";

// AppData structure:
// ../watchdog/
// - watchdog.exe
// - [...]
// - version.txt

export async function WatchDogInstaller(initWatchDog: Boolean = false) {
    if (watchDog?.watchdogUpdating) return;

    const start = Date.now();

    log.info("[WatchDogInstaller]", "Checking for WatchDog update");

    // Get latest release
    const latestRelease = await (
            await fetch(
                "https://api.github.com/repos/zephraOSS/AMRPC-WatchDog/releases/latest"
            )
        )?.json(),
        currentVersion = WatchDogDetails("version"),
        appData = getAppDataPath(),
        watchdogPath = path.join(appData, "/watchdog/");

    if (!latestRelease || latestRelease.tag_name === currentVersion) return;
    if (!fs.existsSync(watchdogPath)) fs.mkdirSync(watchdogPath);

    watchDog.watchdogUpdating = true;

    WatchDogState(false);

    // Download latest release
    const downloadURL = latestRelease.assets?.find(
            (asset) => asset.name === "watchdog.zip"
        )?.browser_download_url,
        downloadPath = path.join(watchdogPath, "watchdog.zip");

    if (!downloadURL) return log.info("[WatchDogInstaller]", "No download URL");

    log.info("[WatchDogInstaller]", "Downloading WatchDog update");

    await fetch(downloadURL).then((res) => {
        const dest = fs.createWriteStream(downloadPath);

        res.body.pipe(dest);
        log.info("[WatchDogInstaller]", "Downloaded WatchDog update");
    });

    log.info("[WatchDogInstaller]", "Deleting old WatchDog files");

    fs.readdirSync(watchdogPath).forEach((file) => {
        if (file === "version.txt") return;

        fs.unlinkSync(path.join(watchdogPath, file));
    });

    log.info("[WatchDogInstaller]", "Awaiting WatchDog update extraction");

    let extractAttempts = 0;

    const extractInterval = setInterval(async () => {
        if (extractAttempts > 30) {
            clearInterval(extractInterval);
            log.error(
                "[WatchDogInstaller]",
                "Failed to extract WatchDog update"
            );

            return;
        } else if (!fs.existsSync(downloadPath)) return extractAttempts++;

        clearInterval(extractInterval);

        log.info("[WatchDogInstaller]", "Extracting WatchDog update");

        await decompress(downloadPath, path.join(watchdogPath));

        fs.writeFileSync(
            path.join(watchdogPath, "version.txt"),
            latestRelease.tag_name
        );

        fs.unlinkSync(downloadPath);

        log.info(
            "[WatchDogInstaller]",
            `Finished in ${(Date.now() - start) / 1000}s`
        );

        watchDog.watchdogUpdating = false;

        if (initWatchDog) watchDog.init();
    }, 1000);
}
