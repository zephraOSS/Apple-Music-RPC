import { Tray, Menu, app } from "electron";
import { Browser } from "./browser";
import * as path from "path";

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
                    parseInt(process.release.toString().replace(".", "")) <=
                        10.15 || process.platform === "win32"
                        ? "iTunes"
                        : "Apple Music",
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
                    app.exit();
                }
            }
        ]);
    }

    update() {
        this.tray.setContextMenu(this.createContextMenu());
    }
}
