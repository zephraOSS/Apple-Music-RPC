const clientId = '842112189618978897',
    DiscordRPC = require("discord-rpc"),
    iTunes = require("itunes-bridge"),
    getAppleMusicLink = require("get-apple-music-link"),
    AutoLaunch = require("auto-launch"),
    electron = require("electron"),
    fs = require('fs');

const rpc = new DiscordRPC.Client({ transport: 'ipc' }),
    currentTrack = iTunes.getCurrentTrack(),
    iTunesEmitter = iTunes.emitter,
    {app, Menu, Notification, Tray} = electron,
    config = JSON.parse(fs.readFileSync(`${__dirname}\\config.json`, 'utf8'));

let presenceData = {
        largeImageKey: 'applemusic-logo',
        largeImageText: `AMRPC - V.${config.version}`
    },
    debugging = false;

iTunesEmitter.on('playing', async function(type, currentTrack) {
    presenceData.details = (currentTrack) ? `${currentTrack.name} - ${currentTrack.album}` : "Unknown track";
    presenceData.state = (currentTrack) ? currentTrack.artist : "Unknown artist";

    if(currentTrack) {
        presenceData.endTimestamp = Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration;
        getAppleMusicLink.track(currentTrack.name, currentTrack.artist, function(res, err){
            if(!err){
                if(debugging) console.log(res);
                presenceData.buttons = [
                    {
                        label: "Play on Apple Music",
                        url: res
                    }
                ]
            }
        });
    }

    if(debugging) {
        console.log("\naction", "playing");
        console.log("type", type);
        console.log("currentTrack.name", currentTrack.name);
        console.log("currentTrack.album", currentTrack.album);
        console.log("timestamp", Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration);
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
    if(debugging) console.log("\naction", "stopped");
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

if(process.argv.find(element => element === "setup")) {
    setTimeout(() => {
        process.exit();
    }, 5000);
    autoLaunch.enable();
}
  
rpc.on('ready', () => {
    updateChecker();
    presenceData.details = (currentTrack) ? `${currentTrack.name} - ${currentTrack.album}` : "Unknown track";
    presenceData.state = currentTrack.artist || "Unknown artist";

    setInterval(() => {
        if(presenceData.details.length > 128) presenceData.details = presenceData.details.substring(0,128);
        if(presenceData.state.length > 128) presenceData.state = presenceData.state.substring(0,128);

        if(currentTrack) rpc.setActivity(presenceData);
    }, 5);
});

app.on("ready", function() {
    let tray = new Tray(`${__dirname}\\assets\\logo.png`),
        isQuiting;

    let autoLaunch = new AutoLaunch({
        name: "AMRPC",
        path: app.getPath('exe')
    });

    app.on("quit", () => tray.destroy());
    app.on('before-quit', function () {
        isQuiting = true;
    });

    tray.setToolTip("AMRPC");
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: `AMRPC V${config.version}`, icon: `${__dirname}\\assets\\tray\\logo@18.png`, enabled: false },
        { type: "separator" },
        { label: "Show Presence", type: "checkbox", checked: (config.show) ? true : false, click() { updateShowRPC(this.checked) } },
        { label: "Quit", click() { isQuiting = true, app.quit() } }
      ]));
    tray.on("right-click", () => tray.update());
    autoLaunch.enable();
});

function updateChecker() {
    const fetchUrl = require("fetch").fetchUrl;

    fetchUrl("https://api.github.com/repos/N0chteil/Apple-Music-RPC/tags", function(error, meta, body) {
        body = JSON.parse(body.toString());
        let version = {
                git: body[0].name.replace(".", "").replace("v", ""),
                package: config.version.replace(".", "")
            }

        if(version.git > version.package) {
            console.log("\x1b[31m%s\x1b[0m", `VersionCheck: Your version is outdated. Newest release is ${body[0].name}`);
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Please download the newest release from GitHub (Updater is currently in work)");
            showNotification("VersionCheck", `Your version is outdated. Newest release is ${body[0].name}`);
            showNotification("VersionCheck", "Please download the newest release from GitHub (Updater is currently in work)");
        } else {
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Up to date");
            showNotification("VersionCheck", "Up to date");
        }
    });
}

function showNotification (title, body) {
    new Notification({title: title,body: body}).show()
}
  
rpc.login({ clientId }).catch(console.error);