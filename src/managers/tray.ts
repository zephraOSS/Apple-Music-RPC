import { Tray, Menu, app, shell } from "electron";

import { quitITunes } from "../utils/quitITunes";
import { Browser } from "./browser";
import { i18n } from "./i18n";

import * as path from "path";

export class TrayManager {
    private tray: Tray;
    private i18n = i18n.getLangStrings();

    constructor() {
        this.tray = new Tray(
            path.join(
                app.getAppPath(),
                process.platform === "darwin"
                    ? "assets/statusBarLogo.png"
                    : "assets/trayLogo@32.png"
            )
        );

        this.tray.setToolTip("AMRPC");
        this.tray.setContextMenu(this.createContextMenu());
        this.tray.on("click", () => new Browser());

        i18n.onLanguageUpdate(() => {
            this.i18n = i18n.getLangStrings();
            this.tray.setContextMenu(this.createContextMenu());
        });
    }

    private createContextMenu(): Electron.Menu {
        return Menu.buildFromTemplate([
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
                        ? "iTunes"
                        : "Apple Music",
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
                label:
                    this.i18n?.tray?.quitITunes?.info ??
                    "This takes about 3 seconds",
                enabled: false,
                visible: process.platform === "win32"
            },
            {
                label: this.i18n?.tray?.quitITunes?.button ?? "Quit iTunes",
                visible: process.platform === "win32",
                click() {
                    quitITunes();
                }
            },
            {
                type: "separator",
                visible: process.platform === "win32"
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
                    app.exit();
                }
            }
        ]);
    }

    update() {
        this.tray.setContextMenu(this.createContextMenu());
    }
}
