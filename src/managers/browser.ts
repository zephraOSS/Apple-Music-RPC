import { app, BrowserWindow } from "electron";
import { getConfig, setConfig, config } from "./store";
import { init as initIPC } from "./ipc";
import { exec } from "child_process";

import * as path from "path";
import * as log from "electron-log";

export class Browser {
    private window: BrowserWindow;

    public isReady: boolean = false;

    static awaitsSend: { channel: string; args: any[] }[] = [];
    static instance: Browser;

    constructor() {
        if (Browser.instance) {
            Browser.windowAction("show");
            return;
        }

        initIPC();

        this.initWindow();

        this.isReady = true;

        this.checkAwaits();

        Browser.instance = this;
    }

    initWindow(show: boolean = false) {
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

        this.window.on("close", () => {
            this.window = null;
        });

        if (show) this.window.show();
    }

    async windowAction(action: string) {
        switch (action) {
            case "show":
                if (this.window) this.window.show();
                else this.initWindow(true);

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
                if (!app.isPackaged) await this.copyBrowserFiles();
                this.window.reload();

                break;
        }
    }

    saveWindowState() {
        setConfig("windowState", this.window.getBounds());
    }

    send(channel: string, ...args: any[]) {
        setTimeout(
            () => this.window.webContents.send(channel, ...args),
            this.isReady ? 0 : 2500
        );
    }

    checkAwaits() {
        if (Browser.awaitsSend.length > 0 && this.window.isVisible()) {
            Browser.awaitsSend.forEach((data) => {
                this.send(data.channel, ...data.args);
            });
        }
    }

    async copyBrowserFiles() {
        if (app.isPackaged) return;

        return new Promise(function (resolve) {
            const execute = exec(
                "npm run copy && cd src/browser/renderer/ && tsc",
                (error, _stdout, stderr) => {
                    if (error)
                        return log.error(
                            "[Browser][copyBrowserFiles][exec] Error",
                            error.message
                        );
                    if (stderr)
                        return log.error(
                            "[Browser][copyBrowserFiles][exec] Stderr",
                            stderr
                        );
                }
            );

            execute.addListener("error", resolve);
            execute.addListener("exit", resolve);
        });
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
        if (create || (Browser.instance && Browser.instance.isReady))
            Browser.getInstance().send(channel, ...args);
        else Browser.awaitsSend.push({ channel, args });
    }

    static setTheme(theme: string) {
        if (config.get("colorTheme") === "auto")
            Browser.send("update-system-theme", false, theme);
    }
}
