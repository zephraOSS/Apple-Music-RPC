const clientId = "842112189618978897",
    DiscordRPC = require("discord-rpc"),
    iTunes = require("itunes-bridge"),
    getAppleMusicLink = require("get-apple-music-link"),
    AutoLaunch = require("auto-launch"),
    {app, Menu, Notification, Tray, BrowserWindow, dialog} = require("electron"),
    Store = require("electron-store"),
    { autoUpdater } = require("electron-updater"),
    path = require("path"),
    log = require("electron-log"),
    url = require("url"),
    fetch = require("fetch").fetchUrl,
    fs = require("fs");

const iTunesEmitter = iTunes.emitter,
    config = new Store({defaults: {
		autolaunch: true,
        show: true,
        hideOnPause: true,
        showAlbumCover: true,
        performanceMode: false,
        colorTheme: "white"
	}});

console.log = log.log;
app.beta = (app.name === "apple-music-rpc" && app.isPackaged) ? false : true;

let rpc = new DiscordRPC.Client({ transport: "ipc" }),
    presenceData = {
        largeImageKey: "applemusic-logo",
        largeImageText: `${app.beta ? "AMRPC - BETA" : "AMRPC"} - V.${app.getVersion()}`
    },
    covers = require("./covers.json");

require("child_process").exec("NET SESSION", function(err,so,se) {
    if(se.length === 0) {
        isQuiting = true;
        console.log("Please do not run AMRPC with administrator privileges!");
        dialog.showErrorBox("Oh no!", "Please do not run AMRPC with administrator privileges!");
        app.quit();
    }
});

iTunesEmitter.on("playing", async function(type, currentTrack) {
    if(!currentTrack) return console.log("No track detected");

    if((currentTrack.mediaKind === 3 || currentTrack.mediaKind === 7) && currentTrack.album.length === 0) presenceData.details = currentTrack.name;
    else presenceData.details = `${currentTrack.name} - ${currentTrack.album}`;

    presenceData.state = currentTrack.artist;

    if(currentTrack.duration > 0)
        presenceData.endTimestamp = Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration;
    else {
        if(presenceData.endTimestamp) delete presenceData.endTimestamp;
        presenceData.details = currentTrack.name;
        presenceData.state = "LIVE";
    }

    checkCover(currentTrack);

    console.log("action", "playing");
    console.log("type", type);
    console.log("currentTrack.name", currentTrack.name);
    console.log("currentTrack.artist", currentTrack.artist);
    console.log("currentTrack.album", currentTrack.album);
    console.log("timestamp", Math.floor(Date.now() / 1000) - currentTrack.elapsedTime + currentTrack.duration);

    getAppleMusicLink.track(currentTrack.name, currentTrack.artist, function(res, err){
        if(!err) {
            console.log("currentTrack url", res);
            presenceData.buttons = [
                {
                    label: "Play on Apple Music",
                    url: res
                }
            ]
        }
    });

});

iTunesEmitter.on("paused", async function(type, currentTrack) {
    if(config.get("hideOnPause")) {
        if(presenceData.details || presenceData.state || presenceData.endTimestamp || presenceData.buttons) rpc.clearActivity();
        delete presenceData.details;
        delete presenceData.state;
        delete presenceData.endTimestamp;
        presenceData.largeImageKey = "applemusic-logo";
    } else {
        delete presenceData.endTimestamp;
        presenceData.largeImageKey = "applemusic-logo";
        presenceData.state = "Paused";
    }

    console.log("action", "paused");
    console.log("type", type);
    console.log("currentTrack.name", currentTrack.name);
    console.log("currentTrack.artist", currentTrack.artist);
    console.log("currentTrack.album", currentTrack.album);
});

iTunesEmitter.on("stopped", async () => {
    console.log("action", "stopped");
    if(presenceData.details || presenceData.state || presenceData.endTimestamp || presenceData.buttons) rpc.clearActivity();
    delete presenceData.details;
    delete presenceData.state;
    delete presenceData.endTimestamp;
    presenceData.largeImageKey = "applemusic-logo";
});
  
rpc.on("ready", () => {
    const currentTrack = iTunes.getCurrentTrack();

    if(currentTrack && currentTrack.playerState === "playing") {

        if((currentTrack.mediaKind === 3 || currentTrack.mediaKind === 7) && currentTrack.album.length === 0) presenceData.details = currentTrack.name;
        else presenceData.details = `${currentTrack.name} - ${currentTrack.album}`;

        presenceData.state = currentTrack.artist || "Unknown artist";

        if(currentTrack.duration === 0) {
            presenceData.details = currentTrack.name;
            presenceData.state = "LIVE";
        }

        checkCover(currentTrack);
    }

    if(config.get("performanceMode")) {
        setInterval(() => {
            if(!presenceData?.details) return rpc.clearActivity();
            if(presenceData.details?.length > 128) presenceData.details = presenceData.details.substring(0,128);
            if(presenceData.state?.length > 128) presenceData.state = presenceData.state.substring(0,128);
            else if(presenceData.state?.length === 0) delete presenceData.state;
    
            rpc.setActivity(presenceData);
        }, 5);
    } else {
        setInterval(() => {
            if(!presenceData?.details || !config.get("show")) return rpc.clearActivity();
            if(presenceData.details?.length > 128) presenceData.details = presenceData.details.substring(0,128);
            if(presenceData.state?.length > 128) presenceData.state = presenceData.state.substring(0,128);
            else if(presenceData.state?.length === 0) delete presenceData.state;
    
            rpc.setActivity(presenceData);
        }, 5);
    }
});

rpc.on("disconnected", () => {
    rpc = new DiscordRPC.Client({ transport: "ipc" });
    rpc.login({ clientId: clientId }).catch(() => rpc.destroy());
});

let mainWindow;

app.on("ready", () => {
    let tray = new Tray(path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/logo.png")),
        isQuiting,
        autoLaunch = new AutoLaunch({
            name: app.beta ? "AMRPC - BETA" : "AMRPC",
            path: app.getPath("exe")
        }),
        cmenu = Menu.buildFromTemplate([
            { label: `${app.beta ? "AMRPC - BETA" : "AMRPC"} V${app.getVersion()}`, icon: path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/tray/logo@18.png"), enabled: false },
            { type: "separator" },
            { label: "Reload AMRPC", click() { reloadAMRPC() } },
            { label: "Check for Updates", click() { updateChecker() } },
            { type: "separator" },
            { label: "Open Settings", click() { mainWindow.show() } },
            { type: "separator" },
            { label: "Quit", click() { isQuiting = true, app.quit() } }
          ]);

    app.on("quit", () => tray.destroy());
    app.on("before-quit", function () {
        isQuiting = true;
    });

    tray.setToolTip(app.beta ? "AMRPC - BETA" : "AMRPC");
    tray.setContextMenu(cmenu);
    tray.on("right-click", () => tray.update());
    tray.on("click", () => mainWindow.show());

    if(config.get("autolaunch")) autoLaunch.enable();
    else autoLaunch.disable();

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/logo.png"),
        frame: false,
        resizable: false
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname),
        protocol: "file:",
        slashes: true
    })+"/index.html");

    require("@electron/remote/main").initialize();

    mainWindow.on("close", function(event) {
        if(!isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.close();

    updateChecker();

    setInterval(() => {
        updateChecker();
    }, 600e3);
});

function updateChecker() {
    console.log("Checking for updates...");

    autoUpdater.setFeedURL({
        provider: "github",
        channel: app.beta ? "beta" : "latest",
        releaseType: app.beta ? "prerelease" : "release"
    });
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on("update-available", () => autoUpdater.downloadUpdate());
    autoUpdater.on("update-downloaded", () => autoUpdater.quitAndInstall());

    if(!app.isPackaged) return;

    fetch("https://raw.githubusercontent.com/N0chteil-Productions/Apple-Music-RPC/main/covers.json", {cache: "no-store"}, function(error, meta, body) {
        body = JSON.parse(body.toString());

        console.log("Checking for new covers...");
        
        if(!isEqual(require("./covers.json"), body)) {
            fs.writeFile(path.join(app.isPackaged ? process.resourcesPath + "/app.asar.unpacked" : __dirname, "/covers.json"), JSON.stringify(body, null, 4), function (err) {if (err) console.log(err)});
            console.log("Updated covers");
            showNotification("AMRPC", "The cover list has been successfully updated.");
            covers = JSON.stringify(body, null, 4);
        } else {
            console.log("No new covers available");
        }
    });
}

function showNotification(title, body) {
    new Notification({title: title, body: body}).show();
}
  
function updateShowRPC(status) {
    if(status) {
        let ct = iTunes.getCurrentTrack();
        if(ct) {
            if((ct.mediaKind === 3 || ct.mediaKind === 7) && ct.album.length === 0) presenceData.details = ct.name;
            else presenceData.details = `${ct.name} - ${ct.album}`;

            presenceData.state = ct.artist;
            if(ct.duration > 0) presenceData.endTimestamp = Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration;

            checkCover(currentTrack);

            console.log("action", "update_cfg_show");
            console.log("currentTrack.name", ct.name);
            console.log("currentTrack.artist", ct.artist);
            console.log("currentTrack.album", ct.album);
            console.log("timestamp", Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration);

            getAppleMusicLink.track(ct.name, ct.artist, function(res, err) {
                if(!err) {
                    console.log("currentTrack url", res);
                    presenceData.buttons = [
                        {
                            label: "Play on Apple Music",
                            url: res
                        }
                    ]
                }
            });
        }
    } else {
        rpc.clearActivity();
        delete presenceData.details;
        delete presenceData.state;
        delete presenceData.endTimestamp;
    }
    
    config.set("show", status);
}

function isEqual(obj1, obj2) {
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    if(obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    for (let objKey of obj1Keys) {
        if (obj1[objKey] !== obj2[objKey]) {
            if(typeof obj1[objKey] == "object" && typeof obj2[objKey] == "object") {
                if(!isEqual(obj1[objKey], obj2[objKey])) {
                    return false;
                }
            } 
            else {
                return false;
            }
        }
    }

    return true;
}

function checkCover(ct) {
    if(!config.get("showAlbumCover")) return presenceData.largeImageKey = "applemusic-logo";

    if(covers.album[ct.album.toLowerCase()]) presenceData.largeImageKey = covers.album[ct.album.toLowerCase()];
    else if(covers.song[ct.name.toLowerCase()]) presenceData.largeImageKey = covers.song[ct.name.toLowerCase()];
    else if(covers.song[ct.album.toLowerCase()]) presenceData.largeImageKey = covers.song[ct.album.toLowerCase()];
    else if(presenceData.largeImageKey !== "applemusic-logo") presenceData.largeImageKey = "applemusic-logo";
}

async function reloadAMRPC() {
    rpc.destroy();
    
    if(config.get("show")) {
        let ct = iTunes.getCurrentTrack();
        if(ct) {
            if((ct.mediaKind === 3 || ct.mediaKind === 7) && ct.album.length === 0) presenceData.details = ct.name;
            else presenceData.details = `${ct.name} - ${ct.album}`;

            presenceData.state = ct.artist;
            if(ct.duration > 0) presenceData.endTimestamp = Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration;

            checkCover(currentTrack);

            console.log("action", "reload_amrpc");
            console.log("currentTrack.name", ct.name);
            console.log("currentTrack.artist", ct.artist);
            console.log("currentTrack.album", ct.album);
            console.log("timestamp", Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration);

            getAppleMusicLink.track(ct.name, ct.artist, function(res, err) {
                if(!err) {
                    console.log("currentTrack url", res);
                    presenceData.buttons = [
                        {
                            label: "Play on Apple Music",
                            url: res
                        }
                    ]
                }
            });
        }
    }
}

rpc.login({ clientId: clientId }).catch(() => rpc.destroy());