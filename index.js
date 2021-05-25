const clientId = '842112189618978897',
    DiscordRPC = require('discord-rpc'),
    iTunes = require('itunes-bridge');

const rpc = new DiscordRPC.Client({ transport: 'ipc' }),
    currentTrack = iTunes.getCurrentTrack(),
    iTunesEmitter = iTunes.emitter;

var presenceData = {
        largeImageKey: 'applemusic-logo',
        largeImageText: 'AMRPC - V.1.0.0',
    };

iTunesEmitter.on('playing', async function(type, currentTrack) {
    presenceData.details = (currentTrack) ? `${currentTrack.name} - ${currentTrack.album}` : "Unknown track";
    presenceData.state = currentTrack.artist || "Unknown artist";
    presenceData.buttons = [
        {
            label: "View Track",
            url: "https://music.apple.com"
        }
    ]

    if(currentTrack) presenceData.endTimestamp = Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration;
});

iTunesEmitter.on('paused', async function(type, currentTrack) {
    delete presenceData.endTimestamp;
    presenceData.state = "Paused";
});

iTunesEmitter.on('stopped', async function() {
});
  
rpc.on('ready', () => {
    presenceData.details = `${currentTrack.name} - ${currentTrack.album}` || "Unknown track";
    presenceData.state = currentTrack.artist || "Unknown artist";

    setInterval(() => {
        if(iTunes.isRunning()) rpc.setActivity(presenceData);
    }, 5);
});
  
rpc.login({ clientId }).catch(console.error);