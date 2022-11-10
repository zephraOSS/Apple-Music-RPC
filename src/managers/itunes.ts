import { Discord } from "./discord";
import { Browser } from "./browser";
import { config } from "./store";
import { AppleBridge } from "apple-bridge";
import { fetchITunes } from "apple-bridge/dist/win32";

import * as log from "electron-log";

export function init() {
    const bridge = new AppleBridge(),
        discord = new Discord(),
        currentTrack = fetchITunes();

    let lastTrack: any = {};

    setTimeout(() => {
        bridge.emit(currentTrack.playerState, "music", currentTrack);
    }, 500);

    bridge.on("playing", "music", (currentTrack) => {
        if (
            currentTrack.name === lastTrack.name &&
            currentTrack.artist === lastTrack.artist &&
            currentTrack.duration === lastTrack.duration
        )
            return;

        log.info(
            "[iTunes]",
            `Playing "${currentTrack.name}" by ${currentTrack.artist}`
        );

        if (Object.keys(currentTrack).length === 0)
            return log.warn("[iTunes] No Track detected");

        lastTrack = currentTrack;

        discord.setCurrentTrack(currentTrack);
    });

    bridge.on("paused", "music", () => {
        if (Object.keys(lastTrack).length === 0) return;

        log.info("[iTunes]", "Paused");

        lastTrack = {};

        if (config.get("hideOnPause")) discord.clearActivity();
        else {
            discord.activity.startTimestamp = null;
            discord.activity.endTimestamp = null;

            Discord.setActivity(discord.activity);
        }

        Browser.send("get-current-track", false, {
            playerState: currentTrack.playerState
        });
    });

    bridge.on("timeChange", "music", async (currentTrack: currentTrack) => {
        if (Object.keys(currentTrack).length === 0) return;

        const { duration, elapsedTime } = currentTrack,
            activity = discord.activity,
            endTimestamp =
                Math.floor(Date.now() / 1000) - elapsedTime + duration;

        if (activity.endTimestamp) {
            if (duration === 0) {
                activity.state = "LIVE";
                delete activity.endTimestamp;

                discord.setActivity(activity);
            } else if (elapsedTime === 0) {
                delete activity.endTimestamp;

                discord.setActivity(activity);
            } else if (activity.endTimestamp !== endTimestamp) {
                activity.endTimestamp = endTimestamp;

                discord.setActivity(activity);
            } else if (elapsedTime >= duration) discord.clearActivity();
            else {
                const dif =
                    +new Date(activity.endTimestamp.toString()) -
                    +new Date() / 1000;

                if (dif <= 0) return discord.clearActivity();
            }
        } else if (discord.isLive && duration > 0) {
            await discord.setCurrentTrack(currentTrack);
        }
    });

    bridge.on("stopped", "music", () => {
        if (Object.keys(lastTrack).length === 0) return;

        log.info("[iTunes]", "Stopped");

        lastTrack = {};

        discord.clearActivity();
    });
}
