import { exec } from "child_process";

import path from "path";

import getAppDataPath from "../getAppDataPath";

import * as log from "electron-log";

export function WatchDogState(start: boolean = false) {
    const appName = "watchdog.exe";

    return new Promise<void>((resolve, reject) => {
        if (start) {
            exec(
                `start ${path.join(getAppDataPath(), "watchdog", appName)}`,
                (error) => {
                    if (error) {
                        log.error(
                            "[WatchDog][State]",
                            "Error starting WatchDog:",
                            error.message
                        );
                        reject(error);
                    } else {
                        log.info("[WatchDog][State]", "Started WatchDog");
                        resolve();
                    }
                }
            );
        } else {
            log.info("[WatchDog][State]", "Stopping WatchDog");

            exec(`tasklist /FI "IMAGENAME eq ${appName}"`, (error, stdout) => {
                if (error) {
                    log.error(
                        "[WatchDog][State]",
                        `Error finding process: ${error.message}`
                    );
                    reject(error);

                    return;
                }

                const lines = stdout.split("\n");

                for (const line of lines) {
                    if (line.includes(appName)) {
                        const parts = line.split(/\s+/),
                            pid = parseInt(parts[1], 10);

                        exec(`taskkill /F /PID ${pid}`, (killError) => {
                            if (killError) {
                                log.error(
                                    "[WatchDog][State]",
                                    `Error killing process: ${killError.message}`
                                );
                                reject(killError);
                            } else {
                                log.info(
                                    "[WatchDog][State]",
                                    `Successfully killed WatchDog process with PID ${pid}`
                                );
                                resolve();
                            }
                        });
                    }
                }
            });
        }
    });
}
