import { Client, Presence, register } from "discord-rpc";
import { app } from "electron";
import { fetchUrl as fetch } from "fetch";
import { getConfig } from "./store";
import * as log from "electron-log";

export class Discord {
    private client: Client;
    private isReady: boolean = false;

    public activity: Presence = {};
    public isLive: boolean = false;
    public currentTrack: currentTrack;

    static instance: Discord;

    constructor() {
        this.connect();

        Discord.instance = this;
    }

    connect() {
        this.client = new Client({
            transport: "ipc"
        });

        this.client
            .login({
                clientId: "842112189618978897"
            })
            .then((client) => {
                log.info("[DISCORD]", `Client logged in ${client.user.id}`);
                this.isReady = true;
            });

        register("842112189618978897");
    }

    setActivity(activity: Presence) {
        activity.largeImageText = `AMRPC - V.${app.getVersion()}`;

        this.activity = activity;
        if (this.isReady) this.client.setActivity(activity);
        else {
            setTimeout(() => this.setActivity(activity), 1000);
        }
    }

    clearActivity() {
        if (this.isReady) this.client.clearActivity();
        else {
            setTimeout(() => this.clearActivity, 1000);
        }
    }

    async setCurrentTrack(currentTrack: currentTrack) {
        const thisCurrenTrack = this.currentTrack;

        if (thisCurrenTrack) delete thisCurrenTrack.url;

        if (thisCurrenTrack === currentTrack) return;

        const activity: Presence = {};

        activity.largeImageKey = getConfig("artwork");
        activity.details = replaceVariables(
            currentTrack,
            "rpcDetails"
        )?.substring(0, 128);
        activity.state = replaceVariables(currentTrack, "rpcState")?.substring(
            0,
            128
        );

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
        const reqParam = encodeURIComponent(`${title} ${album} ${artist}`)
            .replace(/"/g, "%27")
            .replace(/"/g, "%22");

        fetch(
            `https://itunes.apple.com/search?term=${reqParam}&entity=musicTrack`,
            { cache: "no-store" },
            (_error, _meta, body) => {
                if (!body) return callback(null, true);

                const res = JSON.parse(body.toString()).results[0];

                if (res)
                    callback({
                        url: res.trackViewUrl,
                        collectionId: res.collectionId,
                        trackId: res.trackId,
                        explicit: !res.notExplicit,
                        artwork: res.artworkUrl100.replace(
                            "100x100bb",
                            "500x500bb"
                        )
                    });
                else callback(null, true);
            }
        );
    }
}

export function replaceVariables(currentTrack: currentTrack, cfg: string) {
    const config = getConfig(cfg);

    if (
        (!currentTrack.name && config.includes("%title%")) ||
        (!currentTrack.album && config.includes("%album%")) ||
        (!currentTrack.artist && config.includes("%artist%"))
    )
        return;

    return config
        .replace("%title%", currentTrack.name)
        .replace("%album%", currentTrack.album)
        .replace("%artist%", currentTrack.artist);
}
