import { Bridge } from "./bridge";
import { JSONParse } from "../utils/json";

import * as log from "electron-log";

import type { AppleBridge } from "apple-bridge";

interface WatchDogData {
    type: "res" | "event";
    title: string;
    artist: string;
    album: string;
    thumbnailPath: string;
    playerState: "playing" | "paused" | "not_started";
    endTime: number; // Timestamp
}

export class WatchDog {
    private socket: WebSocket;
    private bridge: AppleBridge = Bridge.instance.bridge;

    constructor() {
        this.connect();
    }

    public connect(): void {
        this.socket = new WebSocket("ws://localhost:9632/watchdog");

        this.socket.addEventListener("open", () =>
            log.info("[WatchDog]", "Connected to WatchDog")
        );
        this.socket.addEventListener("close", () =>
            log.info("[WatchDog]", "Disconnected from WatchDog")
        );

        this.socket.onmessage = (e) => {
            const data: WatchDogData = JSONParse(e.data);

            if (!data || Object.keys(data).length === 0) return;
            if (data.type === "res") return;

            if (data.playerState === "playing") {
                this.bridge.emit("playing", "music", {
                    title: data.title,
                    artist: data.artist,
                    album: data.album,
                    playerState: data.playerState,
                    endTime: data.endTime
                });
            } else {
                this.bridge.emit(
                    data.playerState === "not_started"
                        ? "stopped"
                        : data.playerState,
                    "music"
                );
            }
        };
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
        return new Promise((resolve, reject) => {
            let failCount = 0;

            this.socket.send("getCurrentTrack");

            this.socket.onmessage = (e) => {
                const data: WatchDogData = JSONParse(e.data);

                if (!data || Object.keys(data).length === 0) reject();
                if (data.type === "event") {
                    failCount++;

                    if (failCount > 2) reject();

                    return;
                }

                resolve(data);
            };
        });
    }
}
