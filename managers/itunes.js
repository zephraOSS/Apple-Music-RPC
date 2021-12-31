const { app } = require("electron"),
    iTunes = require("itunes-bridge"),
    iTunesEmitter = iTunes.emitter,
    Store = require("electron-store"),
    {
        connect,
        updateActivity,
        clearActivity,
        replaceRPCVars,
    } = require("../managers/discord.js"),
    config = new Store({}),
    appData = new Store({ name: "data" });

console.log = app.addLog;

iTunesEmitter.on("playing", (type, currentTrack) => {
    console.log("[iTunes] Playing");
    if (!currentTrack) return console.log("[iTunes] No Track detected");

    updateActivity(type, currentTrack, "iTunes");
});

iTunesEmitter.on("paused", (type, currentTrack) => {
    console.log("[iTunes] Paused");
    if (!currentTrack) return console.log("[iTunes] No Track detected");

    clearActivity();
});

iTunesEmitter.on("timeChange", async (type, currentTrack) => {
    if (
        !app.discord.presenceData.details ||
        app.discord.presenceData.details.length > 128
    )
        return;
    let ct =
        Math.floor(Date.now() / 1000) -
        currentTrack.elapsedTime +
        currentTrack.duration;

    if (app.discord.presenceData.isLive) {
        let ctg =
            Math.floor(Date.now() / 1000) -
            app.discord.rpc.ctG.elapsedTime +
            app.discord.rpc.ctG.duration;
        const difference = ct > ctg ? ct - ctg : ctg - ct;

        if (app.discord.presenceData.endTimestamp)
            delete app.discord.presenceData.endTimestamp;

        if (difference > 99 && currentTrack.duration > 0) {
            replaceRPCVars(currentTrack, "rpcDetails");
            replaceRPCVars(currentTrack, "rpcState");

            app.discord.presenceData.endTimestamp =
                Math.floor(Date.now() / 1000) -
                currentTrack.elapsedTime +
                (currentTrack.duration +
                    (config.get("performanceMode") ? 1.75 : 1));
            app.discord.presenceData.isLive = false;

            if (app.discord.presenceData.isReady)
                app.discord.client.setActivity(app.discord.presenceData);
        }
        return;
    }

    if (!app.discord.presenceData.endTimestamp) return;

    if (ct !== app.discord.presenceData.endTimestamp) {
        const difference =
            ct > app.discord.presenceData.endTimestamp
                ? ct - app.discord.presenceData.endTimestamp
                : app.discord.presenceData.endTimestamp - ct;

        if (difference > 1.5) {
            app.discord.presenceData.endTimestamp =
                Math.floor(Date.now() / 1000) -
                currentTrack.elapsedTime +
                (currentTrack.duration +
                    (config.get("performanceMode") ? 1.75 : 1));

            if (app.discord.presenceData.isReady)
                app.discord.client.setActivity(app.discord.presenceData);
        }
    }
});

iTunesEmitter.on("stopped", () => {
    console.log("[iTunes] Stopped");
    clearActivity(true);
});
