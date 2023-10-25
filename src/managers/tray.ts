import { Tray, Menu, app, shell } from "electron";

import { WatchDogState } from "../utils/watchdog";
import { quitITunes } from "../utils/quitITunes";
import { Browser } from "./browser";
import { i18n } from "./i18n";
import { config } from "./store";

import * as path from "path";
import * as log from "electron-log";

export class TrayManager {
    private tray: Tray;
    private i18n = i18n.getLangStrings();

    private isDiscordConnected = false;

    constructor() {
        this.tray = new Tray(
            path.join(
                app.getAppPath(),
                process.platform === "darwin"
                    ? "assets/statusBarIcon.png"
                    : "assets/trayLogo@32.png"
            )
        );

        this.tray.setToolTip("AMRPC");
        this.tray.setContextMenu(this.createContextMenu());
        this.tray.on("click", () => {
            if (process.platform === "win32") new Browser();
            else this.tray.popUpContextMenu();
        });

        ["service", "watchdog.mirrorAppState"].forEach((key: any) => {
            config.onDidChange(key, this.update.bind(this));
        });

        i18n.onLanguageUpdate(() => {
            this.i18n = i18n.getLangStrings();
            this.update();
        });
    }

    private createContextMenu(): Electron.Menu {
        const items = [
            {
                label: `${
                    app.isPackaged ? "AMRPC" : "AMRPC - DEV"
                } v${app.getVersion()}`,
                icon: path.join(app.getAppPath(), "assets/trayLogo@18.png"),
                enabled: false
            },
            {
                label:
                    (process.platform === "darwin" &&
                        parseFloat(process.release.toString()) <= 10.15) ||
                    process.platform === "win32"
                        ? config.get("service") === "itunes"
                            ? "iTunes"
                            : "Apple Music (Preview)"
                        : "Apple Music",
                enabled: false
            },
            {
                label: `Discord${
                    this.isDiscordConnected ? " " : " not "
                }connected`,
                enabled: false
            },
            { type: "separator" },
            {
                label: this.i18n?.tray?.reportProblem ?? "Report a Problem",
                click() {
                    shell.openExternal("https://discord.gg/APDghNfJhQ");
                }
            },
            { type: "separator" },
            {
                label: "Settings",
                click() {
                    new Browser();
                }
            },
            { type: "separator" },
            {
                label:
                    this.i18n?.tray?.quitITunes?.info ??
                    "This takes about 3 seconds",
                enabled: false,
                visible:
                    process.platform === "win32" &&
                    config.get("service") === "itunes"
            },
            {
                label: this.i18n?.tray?.quitITunes?.button ?? "Quit iTunes",
                visible:
                    process.platform === "win32" &&
                    config.get("service") === "itunes",
                click() {
                    quitITunes();
                }
            },
            {
                type: "separator",
                visible:
                    process.platform === "win32" &&
                    config.get("service") === "itunes"
            },
            {
                label: this.i18n?.tray?.restart ?? "Restart",
                click() {
                    app.relaunch();
                    app.exit();
                }
            },
            {
                label: this.i18n?.tray?.quit ?? "Quit",
                click() {
                    if (
                        process.platform === "win32" &&
                        config.get("service") === "music" &&
                        config.get("watchdog.mirrorAppState")
                    ) {
                        WatchDogState(false)
                            .then(app.quit)
                            .catch(() => {
                                log.error(
                                    "[READY][Quit]",
                                    "Failed to stop WatchDog. Quitting app."
                                );
                                app.quit();
                            });
                    } else app.quit();
                }
            }
        ];

        return Menu.buildFromTemplate(
            // @ts-ignore
            items.filter((item) => item.visible !== false)
        );
    }

    update() {
        log.info("[TrayManager]", "Updating tray");

        this.tray.setContextMenu(this.createContextMenu());
    }

    public discordConnectionUpdate(isConnected: boolean) {
        this.isDiscordConnected = isConnected;

        if (process.platform === "darwin") {
            this.tray.setImage(
                path.join(
                    app.getAppPath(),
                    `assets/statusBarIcon${isConnected ? "" : "Error"}.png`
                )
            );
        }

        this.update();
    }
}
