import { dialog, shell } from "electron";

import { config } from "./store";
import { i18n } from "./i18n";
import { JSONParse } from "../utils/json";
import {
    WatchDogDetails,
    WatchDogInstaller,
    WatchDogState
} from "../utils/watchdog";

import WebSocket from "ws";
import EventEmitter from "events";

import * as log from "electron-log";

interface WatchDogData {
    type: "res" | "event";
    title: string;
    artist: string;
    album: string;
    duration: number;
    endTime: number; // Timestamp
    thumbnailPath: string;
    playerState: "playing" | "paused" | "not_started";
}

export class WatchDog {
    private socket: WebSocket;
    private emitter = new EventEmitter();

    public watchdogUpdating = false;

    constructor() {
        this.init();
    }

    async init() {
        if (this.watchdogUpdating) {
            log.info("[WatchDog]", "WatchDog is updating");

            setTimeout(this.init, 2500);
        } else {
            if (WatchDogDetails("status")) {
                log.info("[WatchDog]", "WatchDog is installed");

                if (await WatchDogDetails("running")) this.connect();
                else {
                    WatchDogState(true);

                    setTimeout(async () => {
                        if (await WatchDogDetails("running")) this.connect();
                        else this.init();
                    }, 2500);
                }
            } else {
                log.info("[WatchDog]", "WatchDog is not installed");

                if (config.get("watchdog.autoUpdates")) {
                    setTimeout(() => this.init(), 3000);

                    return;
                }

                const strings = i18n.getLangStrings(),
                    msgBox = dialog.showMessageBoxSync({
                        type: "error",
                        // @ts-ignore
                        title: strings.error.watchDog.title,
                        // @ts-ignore
                        message: strings.error.watchDog.description,
                        buttons: [
                            strings.settings.modal.buttons.yes,
                            strings.settings.modal.buttons.learnMore
                        ]
                    });

                switch (msgBox) {
                    case 0:
                        WatchDogInstaller(true);
                        break;

                    case 1:
                        shell.openExternal(
                            "https://docs.amrpc.zephra.cloud/articles/watchdog"
                        );
                        break;

                    default:
                        break;
                }
            }
        }
    }

    public connect(): void {
        this.socket = new WebSocket("ws://localhost:9632/watchdog");

        this.socket.addEventListener("open", () => {
            log.info("[WatchDog]", "Connected to WebSocket");

            // TEMP
            this.socket.send("getCurrentTrack");
        });

        this.socket.addEventListener("close", () =>
            log.info("[WatchDog]", "Disconnected from WebSocket")
        );

        this.socket.addEventListener("error", (e) => {
            log.error("[WatchDog]", "Error connecting to WebSocket", e);
            log.info("[WatchDog]", "Retrying in 5 seconds...");

            setTimeout(this.init, 5000);
        });

        this.socket.addEventListener("message", (e) => {
            const data: WatchDogData = JSONParse(e.data as string);

            if (!data || Object.keys(data).length === 0 || !data.playerState)
                return;
            if (data.type === "res") return;

            if (data.playerState === "playing") {
                const durationMS = data.duration * 1000,
                    startTime = data.endTime - durationMS,
                    currentTime = Date.now(),
                    elapsedTime = (currentTime - startTime) / 1000,
                    remainingTime = (durationMS - elapsedTime * 1000) / 1000;

                this.emitter.emit("playing", {
                    name: data.title || "",
                    artist: data.artist || "",
                    album: data.album || "",
                    duration: data.duration || 0,
                    elapsedTime,
                    remainingTime,
                    endTime: data.endTime,
                    playerState: data.playerState
                });
            } else {
                this.emitter.emit(
                    data.playerState === "not_started"
                        ? "stopped"
                        : data.playerState
                );
            }
        });
    }

    public close(): void {
        this.socket.close();
    }

    public reconnect(): void {
        this.close();
        this.init();
    }

    public isConnected(): boolean {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    public send(message: string): void {
        this.socket.send(message);
    }

    public getCurrentTrack(): Promise<WatchDogData> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) return resolve({} as WatchDogData);

            const gThis = this;

            let failCount = 0;

            this.socket.addEventListener("message", onMessage);
            this.socket.send("getCurrentTrack");

            function onMessage(e: WebSocket.MessageEvent) {
                const data: WatchDogData = JSONParse(e.data as string);

                if (!data || Object.keys(data).length === 0) return reject();

                if (data.type === "event") {
                    failCount++;

                    if (failCount > 4) reject();

                    return;
                }

                resolve(data);
                gThis.socket.removeEventListener("message", onMessage);
            }
        });
    }

    public on(
        event: currentTrack["playerState"],
        listener: (currentTrack: currentTrack) => void
    ) {
        this.emitter.on(event, listener);
    }

    public emit(
        event: currentTrack["playerState"],
        currentTrack: currentTrack
    ) {
        this.emitter.emit(event, currentTrack);
    }
}
