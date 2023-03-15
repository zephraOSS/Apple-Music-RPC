import { Discord } from "./discord";
import { Browser } from "./browser";
import { config } from "./store";
import { appDependencies, lastFM } from "../index";
import { getLangStrings } from "../utils/i18n";

import { dialog, shell } from "electron";
import { AppleBridge, fetchITunes } from "apple-bridge";

import * as log from "electron-log";

export class Bridge {
    private discord: Discord = new Discord();
    private currentTrack: any = fetchITunes();

    public bridge: AppleBridge = new AppleBridge();
    public lastTrack: any = {};
    public pausedTrack: any = {};
    public scrobbleTimeout: NodeJS.Timeout;

    static instance: Bridge;

    constructor() {
        if (!appDependencies.music || !appDependencies.discord) {
            log.warn(
                "[Bridge] Music or Discord not found, skipping bridge init"
            );

            return;
        }

        setTimeout(() => {
            if (
                this.currentTrack &&
                typeof this.currentTrack === "object" &&
                Object.keys(this.currentTrack).length > 0
            ) {
                this.bridge.emit(
                    this.currentTrack.playerState,
                    "music",
                    this.currentTrack
                );
            }
        }, 500);

        this.initListeners();

        Bridge.instance = this;
    }

    private initListeners() {
        this.bridge.on("playing", "music", (currentTrack) => {
            if (
                (currentTrack.name === this.lastTrack.name &&
                    currentTrack.artist === this.lastTrack.artist &&
                    currentTrack.duration === this.lastTrack.duration) ||
                (this.discord.isLive &&
                    currentTrack.name === this.lastTrack.name)
            )
                return;

            log.info(
                "[iTunes]",
                `Playing "${currentTrack.name}" by ${currentTrack.artist}`
            );

            if (Object.keys(currentTrack).length === 0)
                return log.warn("[iTunes] No Track detected");

            if (currentTrack.remainingTime > 0)
                currentTrack.snowflake = generateSnowflake();

            this.discord.setCurrentTrack(currentTrack);

            if (lastFM && config.get("enableLastFM")) {
                if (currentTrack.remainingTime <= 0) {
                    this.lastTrack = currentTrack;
                    return;
                }

                if (
                    this.lastTrack.snowflake === currentTrack.snowflake ||
                    this.pausedTrack.snowflake === currentTrack.snowflake ||
                    (this.pausedTrack.name === currentTrack.name &&
                        this.pausedTrack.remainingTime &&
                        currentTrack.remainingTime &&
                        this.pausedTrack.remainingTime -
                            currentTrack.remainingTime <=
                            25)
                ) {
                    log.info("[LastFM] Skipping scrobble due to same track");

                    this.lastTrack = currentTrack;

                    return;
                }

                log.info("[iTunes][lastFM]", "Updating now playing");

                lastFM.nowPlaying({
                    artist: currentTrack.artist,
                    track: currentTrack.name,
                    album: currentTrack.album,
                    duration: currentTrack.duration
                });

                const timestamp = Math.floor(Date.now() / 1000);

                if (this.scrobbleTimeout) clearTimeout(this.scrobbleTimeout);

                this.scrobbleTimeout = setTimeout(
                    () => {
                        const newTrack = fetchITunes(),
                            oldTrack = currentTrack;

                        delete oldTrack.snowflake;
                        delete oldTrack.remainingTime;
                        delete oldTrack.elapsedTime;
                        delete oldTrack.url;
                        delete oldTrack.artwork;

                        delete newTrack.remainingTime;
                        delete newTrack.elapsedTime;

                        if (
                            newTrack.playerState === "playing" &&
                            Object.keys(newTrack).length > 0 &&
                            objectEqual(oldTrack, newTrack)
                        ) {
                            log.info(
                                "[iTunes][lastFM]",
                                `Scrobbling "${currentTrack.name}" by ${currentTrack.artist}`
                            );

                            lastFM.scrobble({
                                artist: currentTrack.artist,
                                track: currentTrack.name,
                                album: currentTrack.album,
                                duration: currentTrack.duration,
                                timestamp
                            });
                        }
                    },
                    currentTrack.remainingTime > 5
                        ? (currentTrack.remainingTime - 5) * 1000
                        : 0
                );
            }

            this.lastTrack = currentTrack;
        });

        this.bridge.on("paused", "music", () => {
            if (Object.keys(this.lastTrack).length === 0) return;

            log.info("[iTunes]", "Paused");

            this.pausedTrack = this.lastTrack;
            this.lastTrack = {};

            if (config.get("hideOnPause")) this.discord.clearActivity();
            else {
                this.discord.activity.startTimestamp = null;
                this.discord.activity.endTimestamp = null;

                Discord.setActivity(this.discord.activity);
            }

            Browser.send("get-current-track", false, {
                playerState: "paused"
            });
        });

        this.bridge.on(
            "timeChange",
            "music",
            async (currentTrack: currentTrack) => {
                if (Object.keys(currentTrack).length === 0) return;

                const { duration, elapsedTime } = currentTrack,
                    activity = this.discord.activity,
                    endTimestamp =
                        Math.floor(Date.now() / 1000) - elapsedTime + duration;

                if (activity.endTimestamp) {
                    if (duration === 0) {
                        activity.state = "LIVE";
                        delete activity.endTimestamp;

                        if (activity.state !== "LIVE")
                            this.discord.setActivity(activity);
                    } else if (elapsedTime === 0) {
                        delete activity.endTimestamp;

                        this.discord.setActivity(activity);
                    } else if (activity.endTimestamp !== endTimestamp) {
                        activity.endTimestamp = endTimestamp;

                        this.discord.setActivity(activity);
                    } else if (elapsedTime >= duration)
                        this.discord.clearActivity();
                    else {
                        const dif =
                            +new Date(activity.endTimestamp.toString()) -
                            +new Date() / 1000;

                        if (dif <= 0) return this.discord.clearActivity();
                    }
                } else if (this.discord.isLive && duration > 0) {
                    await this.discord.setCurrentTrack(currentTrack);
                }
            }
        );

        this.bridge.on("stopped", "music", () => {
            if (Object.keys(this.lastTrack).length === 0) return;

            log.info("[iTunes]", "Stopped");

            this.lastTrack = {};

            this.discord.clearActivity();
        });

        this.bridge.on("jsFileExtensionError", "music", () => {
            log.error("[iTunes]", "JS File Extension Error.");

            const strings = getLangStrings();

            if (
                dialog.showMessageBoxSync({
                    type: "error",
                    title: "AMRPC - Apple Bridge Error",
                    message: strings.error.jsFileExtension,
                    buttons: [strings.settings.modal.buttons.learnMore]
                }) === 0
            ) {
                shell.openExternal(
                    "https://docs.amrpc.zephra.cloud/articles/js-file-extension-error"
                );
            }
        });
    }
}

function generateSnowflake() {
    return BigInt(
        Math.floor(Date.now() / 1000)
            .toString(2)
            .padStart(42, "0") + "0000000000".padStart(12, "0")
    ).toString();
}

function objectEqual(object1, object2) {
    const keys1 = Object.keys(object1);

    if (keys1.length !== Object.keys(object2).length) return false;

    for (const key of keys1) {
        const val1 = object1[key],
            val2 = object2[key];

        const areObjects = isObject(val1) && isObject(val2);

        if (
            (areObjects && !objectEqual(val1, val2)) ||
            (!areObjects && val1 !== val2)
        )
            return false;
    }

    return true;
}

function isObject(object) {
    return object != null && typeof object === "object";
}
