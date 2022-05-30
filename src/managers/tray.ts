import { Tray, Menu, app } from "electron";
import { Browser } from "./browser";
import * as path from "path";
import { getConfig } from "./store";

export class TrayManager {
    private tray: Tray;

    constructor() {
        this.tray = new Tray(
            path.join(app.getAppPath(), "assets/tray/logo@32.png")
        );
        this.tray.setToolTip("AMRPC");
        this.tray.setContextMenu(this.createContextMenu());

        this.tray.on("click", () => {
            new Browser();
        });

        app.on("before-quit", this.tray.destroy);
    }

    private createContextMenu(): Electron.Menu {
        return Menu.buildFromTemplate([
            {
                label: `${
                    app.isPackaged ? "AMRPC" : "AMRPC - DEV"
                } V.${app.getVersion()}`,
                icon: path.join(app.getAppPath(), "assets/tray/logo@18.png"),
                enabled: false
            },
            {
                label:
                    getConfig("service") === "ame"
                        ? "Apple Music Electron"
                        : process.platform === "darwin"
                        ? "iTunes / Apple Music"
                        : "iTunes",
                enabled: false
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
                    app.quit();
                }
            }
        ]);
    }

    update() {
        this.tray.setContextMenu(this.createContextMenu());
    }
}
