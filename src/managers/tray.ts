import { Tray, Menu, app, shell } from "electron";
import { Browser } from "./browser";

import * as path from "path";

export class TrayManager {
    private tray: Tray;

    constructor() {
        this.tray = new Tray(
            path.join(app.getAppPath(), "assets/trayLogo@32.png")
        );

        this.tray.setToolTip("AMRPC");
        this.tray.setContextMenu(this.createContextMenu());
        this.tray.on("click", () => new Browser());

        app.on("before-quit", this.tray.destroy);
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
                    parseFloat(process.release.toString()) <= 10.15 ||
                    process.platform === "win32"
                        ? "iTunes"
                        : "Apple Music",
                enabled: false
            },
            { type: "separator" },
            {
                label: "Report a Problem",
                click() {
                    shell.openExternal("https://discord.gg/APDghNfJhQ");
                }
            },
            { type: "separator" },
            {
                label: "Restart",
                click() {
                    app.relaunch();
                    app.exit();
                }
            },
            {
                label: "Quit",
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
