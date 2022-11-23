import { exec } from "child_process";

import * as log from "electron-log";

export async function checkAppDependency(): Promise<AppDependencies> {
    const music = await checkIfAppIsInstalled("iTunes", "Music");

    log[!music ? "warn" : "info"](
        `[checkAppDependency][Music] ${music ? "Found" : "Not found"}`
    );

    return {
        music,
        discord: true
    };
}

export async function checkIfAppIsInstalled(
    appName: string,
    appNameMac?: string
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        exec(
            process.platform === "win32"
                ? `where ${appName}`
                : `which ${appNameMac ?? appName}`,
            (err, stdout) => {
                if (err) reject(false);
                else resolve(stdout.includes(appName));
            }
        );
    });
}
