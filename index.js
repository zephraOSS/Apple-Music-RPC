const clientId = '842112189618978897',
    DiscordRPC = require('discord-rpc'),
    iTunes = require('itunes-bridge');

const rpc = new DiscordRPC.Client({ transport: 'ipc' }),
    currentTrack = iTunes.getCurrentTrack(),
    iTunesEmitter = iTunes.emitter;

var presenceData = {
        largeImageKey: 'applemusic-logo',
        largeImageText: `AMRPC - V.${process.env.npm_package_version}`
    },
    debugging = false;

iTunesEmitter.on('playing', async function(type, currentTrack) {
    presenceData.details = (currentTrack) ? `${currentTrack?.name} - ${currentTrack?.album}` : "Unknown track";
    presenceData.state = currentTrack.artist || "Unknown artist";

    if(currentTrack) presenceData.endTimestamp = Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration;

    if(debugging) {
        console.log("\naction", "playing");
        console.log("type", type);
        console.log("currentTrack.name", currentTrack.name);
        console.log("currentTrack.album", currentTrack.album);
        console.log("timestamp", Math.floor(Date.now() / 1000) - currentTrack?.elapsedTime + currentTrack?.duration);
    }
});

iTunesEmitter.on('paused', async function(type, currentTrack) {
    delete presenceData.endTimestamp;
    presenceData.state = "Paused";

    if(debugging) {
        console.log("\naction", "paused");
        console.log("type", type);
        console.log("currentTrack.name", currentTrack.name);
        console.log("currentTrack.album", currentTrack.album);
    }
});

iTunesEmitter.on('stopped', async function() {
    if(debugging) {
        console.log("\naction", "stopped");
    }
});

if(process.argv.find(element => element === "supporting")) {
    presenceData.buttons = [
        {
            label: "Download AMRPC",
            url: "https://github.com/N0chteil/Apple-Music-RPC"
        }
    ]
}

if(process.argv.find(element => element === "debugging")) {
    debugging = true;
}
  
rpc.on('ready', () => {
    presenceData.details = `${currentTrack.name} - ${currentTrack.album}` || "Unknown track";
    presenceData.state = currentTrack.artist || "Unknown artist";

    setInterval(() => {
        if(iTunes.isRunning()) {
            if(presenceData.details.length > 128) presenceData.details = presenceData.details.substring(0,128);
            if(presenceData.state.length > 128) presenceData.state = presenceData.state.substring(0,128);
            rpc.setActivity(presenceData);
        }
    }, 5);
});
  
rpc.login({ clientId }).catch(console.error);