const clientId = '842112189618978897',
    DiscordRPC = require("discord-rpc"),
    iTunes = require("itunes-bridge"),
    getAppleMusicLink = require("get-apple-music-link"),
    AutoLaunch = require("auto-launch"),
    request = require("request");

const rpc = new DiscordRPC.Client({ transport: 'ipc' }),
    currentTrack = iTunes.getCurrentTrack(),
    iTunesEmitter = iTunes.emitter;

let presenceData = {
        largeImageKey: 'applemusic-logo',
        largeImageText: `AMRPC - V.${process.env.npm_package_version}`
    },
    debugging = false;

let autoLaunch = new AutoLaunch({
    name: "",
    path: __dirname+"AMRPC.bat"
});

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
                        label: "Play on Apple Musicᴮᴱᵀᴬ",
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

function updateChecker() {
    const fetchUrl = require("fetch").fetchUrl;

    fetchUrl("https://api.github.com/repos/N0chteil/Apple-Music-RPC/tags", function(error, meta, body) {
        body = JSON.parse(body.toString());
        let version = {
                git: body[0].name.replace(".", "").replace("v", ""),
                package: process.env.npm_package_version.replace(".", "")
            }

        if(version.git > version.package) {
            console.log("\x1b[31m%s\x1b[0m", `VersionCheck: Your version is outdated. Newest release is ${body[0].name}`);
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Downloading newest release...");
            setTimeout(() => {
                updateVersion(body[0].name);
            }, 2000);
        } else {
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Up to date");
        }
    });
}

function updateVersion(version) {
    const download = require("download-git-repo"),
        fs = require('fs');
    
    download(`direct:https://github.com/N0chteil/Apple-Music-RPC/releases/download/${version}/amrpc-win.zip`, 'github_newest', function (err) {
        err = (err === undefined || err === false) ? false : true;
        if(!err) {
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Successfully downloaded!");
            fs.writeFile("updater.bat", 'del "index.js"\ndel "package.json"\nmove /y github_newest\\*.* .\n@RD /S /Q "github_newest"\nnpm install\ndel "updater.bat"', function(err) {
                if(err) return console.log(err);
                else {
                    console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Created updater file. Exiting process in 10 seconds.");
                    console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Please open the updater file after the process is finished.");
                }
            }); 
            setTimeout(() => {
                require('child_process').exec('updater.bat');
                process.exit();
            }, 10000);
        } else {
            console.log("\x1b[36m%s\x1b[0m", "VersionCheck: Error downloading the latest version from GitHub");
        }
    })
}
  
rpc.login({ clientId }).catch(console.error);