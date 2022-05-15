import iTunes from "itunes-bridge";
import { Discord } from "./discord";
import * as log from "electron-log";

export function init() {
    const iTunesEmitter = iTunes.emitter,
        discord = new Discord();

    iTunes.getCurrentTrack().then((currentTrack: currentTrack) => {
        setTimeout(() => {
            iTunesEmitter.emit(
                currentTrack.playerState,
                "new_track",
                currentTrack
            );
        }, 500);
    });

    iTunesEmitter.on("playing", (_type, currentTrack: currentTrack) => {
        log.info(
            "[iTunes]",
            `Playing "${currentTrack.name}" by ${currentTrack.artist}`
        );

        if (Object.keys(currentTrack).length === 0)
            return log.warn("[iTunes] No Track detected");

        discord.setCurrentTrack(currentTrack);
    });

    iTunesEmitter.on("paused", (_type, currentTrack: currentTrack) => {
        log.info("[iTunes]", "Paused");

        if (Object.keys(currentTrack).length === 0)
            return log.warn("[iTunes] No Track detected");

        discord.clearActivity();
    });

    iTunesEmitter.on(
        "timeChange",
        async (_type, currentTrack: currentTrack) => {
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
        }
    );

    iTunesEmitter.on("stopped", () => {
        log.info("[iTunes]", "Stopped");
        discord.clearActivity();
    });
}
