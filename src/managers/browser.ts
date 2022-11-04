import { app, BrowserWindow } from "electron";
import { getConfig, setConfig, config } from "./store";
import { init as initIPC } from "./ipc";
import path from "path";

export class Browser {
    private window: BrowserWindow;

    static awaitsSend: { channel: string; args: any[] }[] = [];
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

        ["moved", "close"].forEach((event: any) => {
            this.window.on(event, Browser.saveWindowState);
        });

        this.checkAwaits();

        Browser.instance = this;
    }

    windowAction(action: string) {
        switch (action) {
            case "show":
                this.window.show();
                this.checkAwaits();

                break;
            case "hide":
                this.window.hide();

                break;
            case "close":
                this.window.close();

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

    checkAwaits() {
        if (
            Browser.awaitsSend.length > 0 &&
            Browser.instance &&
            Browser.getInstance().window.isVisible()
        ) {
            Browser.awaitsSend.forEach((data) => {
                this.send(data.channel, ...data.args);
            });
        }
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

    static send(channel: string, create: boolean = false, ...args: any[]) {
        if (create || Browser.instance)
            Browser.getInstance().send(channel, ...args);
        else Browser.awaitsSend.push({ channel, args });
    }

    static setTheme(theme: string) {
        if (config.get("colorTheme") === "auto")
            Browser.send("update-system-theme", false, theme);
    }
}
