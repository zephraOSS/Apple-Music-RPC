import { Client, Presence, register, User } from "discord-rpc";
import { app } from "electron";

import { appDependencies } from "../index";

import { config, getConfig, setConfig } from "./store";
import { Browser } from "./browser";
import { Bridge } from "./bridge";
import { SongData } from "./SongData";

import { checkSupporter } from "../utils/checkSupporter";
import { songDataSearchStation } from "../utils/advancedSongDataSearch";
import { getLibrarySongArtwork } from "../utils/getLibrarySongArtwork";
import { replaceVariables } from "../utils/replaceVariables";

import * as log from "electron-log";

export class Discord {
    private client: Client;
    private isReady: boolean = false;
    private startUp: boolean = true;
    private defaultLIT: string = `AMRPC - ${
        app.isPackaged ? app.getVersion() : "Development"
    }`;
    private triggerAfterReady: (() => void)[] = [];

    public activity: Presence = {};
    public isLive: boolean = false;
    public currentTrack: currentTrack;
    public isSupporter: boolean = null;
    public songData: SongData = new SongData();

    static instance: Discord;

    constructor() {
        if (!appDependencies.discord) return;

        this.connect();

        Discord.instance = this;

        ["rpcDetails", "rpcState", "rpcLargeImageText"].forEach((key) => {
            // @ts-ignore
            config.onDidChange(key, () => configChange(key));
        });

        function configChange(type: string) {
            if (
                Discord.instance.currentTrack &&
                Object.keys(Discord.instance.currentTrack).length > 0 &&
                !Discord.instance.isLive
            ) {
                const discordType = type.replace("rpc", "");

                Discord.instance.activity[
                    discordType.charAt(0).toLowerCase() + discordType.slice(1)
                ] = new replaceVariables(
                    Discord.instance.currentTrack
                ).getResult(discordType);

                Discord.setActivity(Discord.instance.activity);
            }
        }
    }

    connect() {
        this.client = new Client({
            transport: "ipc"
        });

        this.client
            .login({
                clientId: "842112189618978897"
            })
            .then(async (client) => {
                log.info("[DISCORD]", `Client logged in ${client.user.id}`);

                try {
                    this.isSupporter = await checkSupporter(client.user.id);
                } catch (err) {
                    log.error("[DISCORD]", `Supporter check error: ${err}`);
                }

                if (!this.isSupporter) {
                    this.activity.largeImageText = this.defaultLIT;

                    setConfig("rpcLargeImageText", `AMRPC - %version%`);
                }

                this.isReady = true;
                this.startUp = false;

                this.triggerAfterReady.forEach((func) => func());
                this.triggerAfterReady = [];
            })
            .catch((err) => {
                log.error("[DISCORD]", `Client login error: ${err}`);
                log.info("[DISCORD]", "Retrying in 5 seconds...");

                // Could not connect: Discord (most likely) not running
                // RPC_CONNECTION_TIMEOUT: Discord (most likely) running and needs restart (most of the time)
                // -> retry in 5 seconds

                setTimeout(() => this.connect(), 5000);
            });

        this.client.on("disconnected", () => {
            log.info("[DISCORD]", "Client disconnected");

            this.isReady = false;

            this.connect();
        });

        register("842112189618978897");
    }

    setActivity(activity: Presence) {
        if (!this.isSupporter) activity.largeImageText = this.defaultLIT;
        if (!config.get("showTimestamps")) delete activity.endTimestamp;

        this.activity = activity;

        if (this.isReady) {
            const time = Date.now();

            this.client
                .setActivity(activity)
                .then(() => {
                    log.info(
                        "[DISCORD][setActivity]",
                        `Activity set (${Date.now() - time}ms)`
                    );
                })
                .catch((err) => {
                    log.error("[DISCORD][setActivity]", `Client error: ${err}`);
                });
        } else {
            if (!this.startUp) this.connect();

            this.triggerAfterReady.push(() => this.setActivity(activity));
        }
    }

    clearActivity() {
        if (this.isReady) {
            const time = Date.now();

            this.client
                .clearActivity()
                .then(() => {
                    log.info(
                        "[DISCORD][clearActivity]",
                        `Activity cleared (${Date.now() - time}ms)`
                    );
                })
                .catch((err) => {
                    log.error(
                        "[DISCORD][clearActivity]",
                        `Client error: ${err}`
                    );
                });
        } else {
            if (!this.startUp) this.connect();

            this.triggerAfterReady.push(() => this.clearActivity());
        }
    }

    async setCurrentTrack(currentTrack: currentTrack) {
        const thisCurrenTrack = this.currentTrack;

        if (thisCurrenTrack) delete thisCurrenTrack.url;
        if (thisCurrenTrack === currentTrack) return;

        const activity: Presence = {},
            replacedVars = new replaceVariables(currentTrack);

        activity.largeImageText = replacedVars.getResult("largeImageText");
        activity.largeImageKey = getConfig("artwork");
        activity.details = replacedVars.getResult("details");
        activity.state = replacedVars.getResult("state");

        if (currentTrack.duration > 0) {
            activity.endTimestamp =
                Math.floor(Date.now() / 1000) -
                currentTrack.elapsedTime +
                currentTrack.duration;

            this.isLive = false;
        } else if (!currentTrack.artist && !currentTrack.album) {
            if (activity.endTimestamp) delete activity.endTimestamp;

            activity.details = currentTrack.name.substring(0, 128);
            activity.state = "LIVE";

            this.isLive = true;
        }

        this.currentTrack = currentTrack;

        this.setActivity(activity);

        if (this.isLive) {
            const songData = await songDataSearchStation(currentTrack.name);

            if (songData.artwork) activity.largeImageKey = songData.artwork;
            if (songData.url)
                activity.buttons = [
                    {
                        label: "Play on Apple Music",
                        url: songData.url
                    }
                ];

            this.setActivity(activity);
        } else {
            if (!config.get("artworkPrioLocal")) {
                this.getSongData(currentTrack).catch(async () => {
                    this.setLocalArtwork(await Bridge.getCurrentTrackArtwork()).catch(
                        () => {
                            this.activity.largeImageKey = getConfig("artwork");
                            this.setActivity(this.activity);
                        }
                    );
                });
            } else {
                this.setLocalArtwork(await Bridge.getCurrentTrackArtwork())
                    .then(() => {
                        this.getSongData(
                            currentTrack,
                            this.activity,
                            true
                        ).catch(() => {});
                    })
                    .catch(() => {
                        this.getSongData(currentTrack).catch(() => {
                            this.activity.largeImageKey = getConfig("artwork");
                            this.setActivity(this.activity);
                        });
                    });
            }
        }
    }

    setLocalArtwork(artwork: string) {
        return new Promise(async (resolve, reject) => {
            const artworkData = await getLibrarySongArtwork(artwork);

            if (artworkData && artworkData.url) {
                this.activity.largeImageKey = artworkData.url;

                Browser.send("get-current-track", false, {
                    artwork: artworkData.url,
                    playerState: "playing"
                });

                this.setActivity(this.activity);
                resolve(null);
            } else reject("No artwork found");
        });
    }

    getSongData(currentTrack, activity = this.activity, noArtwork = false) {
        return new Promise((resolve, reject) => {
            this.songData
                .getSongData(
                    currentTrack.name,
                    currentTrack.album,
                    currentTrack.artist
                )
                .then((data) => {
                    currentTrack.url = data.url;

                    activity.buttons = [
                        {
                            label: "Play on Apple Music",
                            url: data.url
                        }
                    ];

                    if (!noArtwork) {
                        if (!currentTrack.artwork)
                            currentTrack.artwork = data.artwork;

                        Browser.send("get-current-track", false, {
                            artwork: data.artwork,
                            playerState: currentTrack.playerState
                        });

                        if (getConfig("showAlbumArtwork"))
                            activity.largeImageKey = currentTrack.artwork;
                    }

                    this.setActivity(activity);
                    resolve(null);
                })
                .catch((err) => {
                    log.error(
                        "[DISCORD][setCurrentTrack][getSongData]",
                        `Error: ${err}`
                    );

                    delete activity.buttons;
                    delete this.activity.buttons;

                    reject(err);
                });
        });
    }

    static getInstance() {
        if (!Discord.instance) new Discord();

        return Discord.instance;
    }

    static setActivity(activity: Presence) {
        Discord.getInstance().setActivity(activity);
    }

    static clearActivity() {
        Discord.getInstance().clearActivity();
    }

    static setCurrentTrack(currentTrack: currentTrack) {
        Discord.getInstance().setCurrentTrack(currentTrack);
    }
}

export function getUserData(): Promise<User> {
    return new Promise((resolve, reject) => {
        const client = new Client({ transport: "ipc" });

        client
            .login({
                clientId: "686635833226166279"
            })
            .then(({ user }) => client.destroy().then(() => resolve(user)))
            .catch(reject);
    });
}
