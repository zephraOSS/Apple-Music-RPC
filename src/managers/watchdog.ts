import { JSONParse } from "../utils/json";

import * as log from "electron-log";

import WebSocket from "ws";
import EventEmitter from "events";

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

    constructor() {
        this.connect();
    }

    public connect(): void {
        this.socket = new WebSocket("ws://localhost:9632/watchdog");

        this.socket.addEventListener("open", () => {
            log.info("[WatchDog]", "Connected to WatchDog");

            // TEMP
            this.socket.send("getCurrentTrack");
        });

        this.socket.addEventListener("close", () =>
            log.info("[WatchDog]", "Disconnected from WatchDog")
        );

        this.socket.addEventListener("message", (e) => {
            log.debug(
                "[WatchDog]",
                "--REMOVE IN PROD.--",
                "Received message from WatchDog",
                e.data
            );

            const data: WatchDogData = JSONParse(e.data as string);

            if (!data || Object.keys(data).length === 0 || !data.playerState)
                return;
            //if (data.type === "res") return;

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
        this.connect();
    }

    public isConnected(): boolean {
        return this.socket.readyState === WebSocket.OPEN;
    }

    public send(message: string): void {
        this.socket.send(message);
    }

    public getCurrentTrack(): Promise<WatchDogData> {
        return new Promise((resolve) => {
            if (!this.isConnected()) return resolve({} as WatchDogData);

            // TODO: WatchDog request support
            // let failCount = 0;
            //
            // this.socket.send("getCurrentTrack");
            // this.socket.addEventListener("message", (e) => {
            //     const data: WatchDogData = JSONParse(e.data);
            //
            //     if (!data || Object.keys(data).length === 0) reject();
            //     if (data.type === "event") {
            //         failCount++;
            //
            //         if (failCount > 2) reject();
            //
            //         return;
            //     }
            //
            //     resolve(data);
            // });
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
