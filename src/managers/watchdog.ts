import { dialog, shell } from "electron";

import { watchDog } from "../index";
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
                        if (await WatchDogDetails("running"))
                            watchDog.connect();
                        else watchDog.init();
                    }, 2500);
                }
            } else {
                log.info("[WatchDog]", "WatchDog is not installed");

                if (config.get("watchdog.autoUpdates")) {
                    setTimeout(watchDog.init, 3000);

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
        let closeByError = false;

        this.socket = new WebSocket("ws://localhost:9632/watchdog");

        this.socket.addEventListener("open", () => {
            log.info("[WatchDog]", "Connected to WebSocket");

            // TEMP
            this.socket.send("getCurrentTrack");
        });

        this.socket.addEventListener("close", () => {
            log.info("[WatchDog]", "Disconnected from WebSocket");

            if (!closeByError) {
                log.info("[WatchDog]", "Retrying in 5 seconds...");
                setTimeout(this.init, 5000);
            } else closeByError = false;
        });

        this.socket.addEventListener("error", (e) => {
            closeByError = true;

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
                const { elapsedTime, remainingTime } = this.getTimeData(
                    data.duration,
                    data.endTime
                );

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

    public getCurrentTrack(): Promise<currentTrack> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) return resolve({} as currentTrack);

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

                const { elapsedTime, remainingTime } = gThis.getTimeData(
                    data.duration,
                    data.endTime
                );

                resolve({
                    name: data.title || "",
                    artist: data.artist || "",
                    album: data.album || "",
                    duration: data.duration || 0,
                    elapsedTime,
                    remainingTime,
                    endTime: data.endTime,
                    playerState: data.playerState
                } as currentTrack);
                gThis.socket.removeEventListener("message", onMessage);
            }
        });
    }

    private getTimeData(duration: number, endTime: number) {
        const durationMS = duration * 1000,
            elapsedTime = (Date.now() - (endTime - durationMS)) / 1000,
            remainingTime = (durationMS - elapsedTime * 1000) / 1000;

        return {
            elapsedTime,
            remainingTime
        };
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
