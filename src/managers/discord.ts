import { app } from "electron";
import { Browser } from "./browser";
import { cache, config, getConfig, setConfig } from "./store";
import { Client, Presence, register } from "discord-rpc";
import { checkSupporter } from "../utils/checkSupporter";
import { replaceVariables } from "../utils/replaceVariables";

import { fetchUrl as fetch } from "fetch";

import * as log from "electron-log";

export class Discord {
    private client: Client;
    private isReady: boolean = false;
    private startUp: boolean = true;
    private defaultLIT: string = `AMRPC - V.${app.getVersion()}`;

    public activity: Presence = {};
    public isLive: boolean = false;
    public currentTrack: currentTrack;
    public isSupporter: boolean = null;

    static instance: Discord;

    constructor() {
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
                ).getResult(type);

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

                this.isSupporter = await checkSupporter(client.user.id);

                if (!this.isSupporter) {
                    setConfig(
                        "rpcLargeImageText",
                        `AMRPC - V.${app.getVersion()}`
                    );
                }

                this.isReady = true;
                this.startUp = false;
            });

        this.client.on("disconnected", () => {
            log.info("[DISCORD]", "Client disconnected");

            this.isReady = false;
        });

        register("842112189618978897");
    }

    setActivity(activity: Presence) {
        if (!this.isSupporter) activity.largeImageText = this.defaultLIT;

        this.activity = activity;
        if (this.isReady) this.client.setActivity(activity);
        else {
            if (!this.startUp) this.connect();

            setTimeout(() => this.setActivity(activity), 4500);
        }
    }

    clearActivity() {
        if (this.isReady) this.client.clearActivity();
        else {
            if (!this.startUp) this.connect();
            setTimeout(() => this.clearActivity(), this.startUp ? 1000 : 2500);
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
        } else {
            if (activity.endTimestamp) delete activity.endTimestamp;

            activity.details = currentTrack.name.substring(0, 128);
            activity.state = "LIVE";

            this.isLive = true;
        }

        this.currentTrack = currentTrack;
        this.setActivity(activity);

        Discord.getAppleMusicData(
            currentTrack.name,
            currentTrack.album,
            currentTrack.artist,
            (res, err) => {
                if (!err) {
                    currentTrack.url = res.url;

                    activity.buttons = [
                        {
                            label: "Play on Apple Music",
                            url: res.url
                        }
                    ];

                    if (!currentTrack.artwork)
                        currentTrack.artwork = res.artwork;

                    Browser.send("get-current-track", false, {
                        artwork: res.artwork,
                        playerState: currentTrack.playerState
                    });

                    if (getConfig("showAlbumArtwork"))
                        activity.largeImageKey = currentTrack.artwork;

                    this.setActivity(activity);
                } else if (activity.buttons) delete activity.buttons;
            }
        );
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

    static getAppleMusicData(
        title: string,
        album: string,
        artist: string,
        callback
    ) {
        if (title === "Connecting…") return callback(null, true);

        const reqParam = encodeURIComponent(`${title} ${album} ${artist}`)
                .replace(/"/g, "%27")
                .replace(/"/g, "%22"),
            cacheItem = cache.get(`${title}_:_${album}_:_${artist}`);

        if (cacheItem) return callback(cacheItem);

        fetch(
            `https://itunes.apple.com/search?term=${reqParam}&entity=musicTrack`,
            { cache: "no-store" },
            (_error, _meta, body) => {
                if (!body) return callback(null, true);

                const res = JSON.parse(body.toString()).results[0];

                if (res) {
                    const result = {
                        url: res.trackViewUrl,
                        collectionId: res.collectionId,
                        trackId: res.trackId,
                        explicit: !res.notExplicit,
                        artwork: res.artworkUrl100.replace(
                            "100x100bb",
                            "500x500bb"
                        )
                    };

                    cache.set(`${title}_:_${album}_:_${artist}`, result);
                    callback(result);
                } else callback(null, true);
            }
        );
    }
}

export function getUserData() {
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
