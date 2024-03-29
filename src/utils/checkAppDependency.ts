import { dialog, shell } from "electron";
import { exec } from "child_process";

import { i18n } from "../managers/i18n";
import { config } from "../managers/store";

import * as log from "electron-log";
import execPromise from "./execPromise";
import { Browser } from "../managers/browser";

export async function checkAppDependency(): Promise<AppDependencies> {
    const iTunes =
        process.platform === "win32"
            ? await checkIfAppIsInstalled("iTunes")
            : true;
    const appleMusic =
        process.platform === "win32"
            ? await checkIfAppIsInstalled("Apple Music")
            : null;

    // TODO: check if WatchDog is installed

    if (iTunes || appleMusic) {
        log["info"](
            `[checkAppDependency][Music] ${
                iTunes ? "iTunes Found" : "AppleMusicPreview found"
            }`
        );
    } else {
        log["warn"]("[checkAppDependency][Music] Not found");
    }

    return {
        music: iTunes || appleMusic,
        iTunes: iTunes,
        appleMusic,
        watchDog: true,
        discord: true
    };
}

export async function checkIfAppIsInstalled(appName: string): Promise<boolean> {
    if (appName === "iTunes" && !config.get("checkIfMusicInstalled")) {
        log.info(
            "[checkAppDependency][checkIfAppIsInstalled]",
            "Skipping iTunes"
        );

        return true;
    }

    if (appName === "Apple Music") {
        const stdout = await execPromise(
            `Get-AppxPackage -Name "AppleInc.AppleMusicWin"`,
            { shell: "powershell.exe" }
        );

        return stdout.includes("AppleMusicWin");
    }

    try {
        exec(`where ${appName}`, (err, stdout) => {
            if (err) {
                log.error("[checkAppDependency][checkIfAppIsInstalled]", err);

                if (err.toString().includes("Command failed: where iTunes")) {
                    const strings = i18n.getLangStrings();

                    if (!strings || Object.keys(strings).length === 0) {
                        log.error(
                            "[checkAppDependency][checkIfAppIsInstalled]",
                            "i18n strings not found"
                        );

                        return false;
                    }

                    if (
                        dialog.showMessageBoxSync({
                            type: "info",
                            title: "AMRPC",
                            message: strings.error.iTunesInstalledCheck,
                            buttons: [strings.general.buttons.openSettings]
                        }) === 0
                    )
                        Browser.windowAction("show");
                }

                return false;
            } else {
                return stdout.includes(appName);
            }
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

        if (!strings || Object.keys(strings).length === 0) {
            log.error(
                "[checkAppDependency][checkIfAppIsInstalled]",
                "i18n strings not found"
            );

            return false;
        }

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

        return false;
    }
}
