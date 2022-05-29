import { app, BrowserWindow } from "electron";
import { getConfig, setConfig, config } from "./store";
import { init as initIPC } from "./ipc";
import { AutoTheme } from "electron-autotheme";
import path from "path";

export class Browser {
    private window: BrowserWindow;
    private autoTheme: AutoTheme;

    static instance: Browser;

    constructor() {
        if (Browser.instance) {
            Browser.windowAction("show");
            return;
        }

        initIPC();

        const windowState = getConfig("windowState");

        this.window = new BrowserWindow({
            x: windowState?.x,
            y: windowState?.y,
            webPreferences: {
                preload: path.join(app.getAppPath(), "browser/preload.js")
            },
            icon: path.join(app.getAppPath(), "assets/logo.png"),
            frame: false,
            resizable: false
        });

        this.window.loadFile(path.join(app.getAppPath(), "browser/index.html"));

        if (getConfig("colorTheme") === "auto") {
            this.autoTheme = new AutoTheme((useDark) => {
                this.send("update-system-theme", useDark ? "dark" : "light");
            }, config);
        }

        ["moved", "close"].forEach((event: any) => {
            this.window.on(event, Browser.saveWindowState);
        });

        Browser.instance = this;
    }

    windowAction(action: string) {
        switch (action) {
            case "show":
                this.window.show();
                break;
            case "hide":
                this.window.hide();
                break;
            case "close":
                this.window.close();
                this.autoTheme.stop();

                break;
            case "minimize":
                this.window.minimize();
                break;
            case "maximize":
                this.window.maximize();
                break;
            case "restore":
                this.window.restore();
                break;
            case "reload":
                this.window.reload();
                break;
        }
    }

    saveWindowState() {
        setConfig("windowState", this.window.getBounds());
    }

    send(channel: string, ...args: any[]) {
        this.window.webContents.send(channel, ...args);
    }

    static getInstance(): Browser {
        if (!Browser.instance) Browser.instance = new Browser();

        return Browser.instance;
    }

    static windowAction(action: string) {
        Browser.getInstance().windowAction(action);
    }

    static saveWindowState() {
        Browser.getInstance().saveWindowState();
    }

    static send(channel: string, ...args: any[]) {
        Browser.getInstance().send(channel, ...args);
    }
}
