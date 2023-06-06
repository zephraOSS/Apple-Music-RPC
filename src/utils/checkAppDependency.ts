import { dialog, shell } from "electron";
import { exec } from "child_process";

import { i18n } from "../managers/i18n";
import { config } from "../managers/store";

import * as log from "electron-log";

export async function checkAppDependency(): Promise<AppDependencies> {
    const music =
        process.platform !== "win32" || !config.get("checkIfMusicInstalled")
            ? true
            : await checkIfAppIsInstalled("iTunes");

    log[!music ? "warn" : "info"](
        `[checkAppDependency][Music] ${music ? "Found" : "Not found"}`
    );

    return {
        music,
        discord: true
    };
}

export async function checkIfAppIsInstalled(appName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            exec(`where ${appName}`, (err, stdout) => {
                if (err) {
                    log.error(
                        "[checkAppDependency][checkIfAppIsInstalled]",
                        err
                    );
                    reject(false);
                } else resolve(stdout.includes(appName));
            });
        } catch (e) {
            log.info(
                "[checkAppDependency][checkIfAppIsInstalled]",
                "Check the documentation for more information:",
                "https://docs.amrpc.zephra.cloud/articles/command-prompt-error"
            );
            log.error(
                "[checkAppDependency][checkIfAppIsInstalled]",
                "Check if AMRPC has permission to access Command Prompt"
            );
            log.error("[checkAppDependency][checkIfAppIsInstalled]", e);

            const strings = i18n.getLangStrings();

            if (
                dialog.showMessageBoxSync({
                    type: "error",
                    title: "AMRPC - Apple Bridge Error",
                    message: strings.error.cmd,
                    buttons: [strings.settings.modal.buttons.learnMore]
                }) === 0
            ) {
                shell.openExternal(
                    "https://docs.amrpc.zephra.cloud/articles/command-prompt-error"
                );
            }

            reject(false);
        }
    });
}
