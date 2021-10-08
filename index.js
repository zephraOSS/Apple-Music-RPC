const clientId = "842112189618978897",
    DiscordRPC = require("discord-rpc"),
    iTunes = require("itunes-bridge"),
    AutoLaunch = require("auto-launch"),
    { ipcMain, app, Menu, Notification, Tray, BrowserWindow, dialog } = require("electron"),
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
        colorTheme: "white",
        language: "en_US",
        rpcDetails: "%title% - %album%",
        rpcState: "%artist%"
    }}),
    appData = new Store({name: "data", defaults: {
        userCountUsageAsked: false,
        nineelevenAsked: false,
        appleEventAsked: false,
        nineelevenCovers: false
    }});

console.log = log.log;
app.dev = (app.isPackaged) ? false : true;

let rpc = new DiscordRPC.Client({ transport: "ipc" }),
    presenceData = {
        largeImageKey: "applemusic-logo",
        largeImageText: `${app.dev ? "AMRPC - DEV" : "AMRPC"} - V.${app.getVersion()}`
    },
    covers = require("./covers.json"),
    userLang = config.get("language"),
    langString = require(`./language/${userLang}.json`),
    ctG,
    disconnected = false;

require("child_process").exec("NET SESSION", function(err,so,se) {
    if(se.length === 0) {
        isQuiting = true;
        console.log("Please do not run AMRPC with administrator privileges!");
        dialog.showErrorBox("Oh no!", langString.error.admin);
        app.quit();
    }
});

iTunesEmitter.on("playing", async function(type, currentTrack) {
    if(!currentTrack) return console.log("No track detected");
    ctG = currentTrack;

    if(currentTrack.album === 0) presenceData.details = currentTrack.name;
    else replaceRPCVars(currentTrack, "rpcDetails");

    replaceRPCVars(currentTrack, "rpcState");

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

    getAppleMusicData(currentTrack.name, currentTrack.artist, function(res, err) {
        if (!err) {
            console.log("currentTrack url", res.url);
            presenceData.buttons = [
                {
                    label: "Play on Apple Music",
                    url: res.url
                }
            ]
        } else if(presenceData.buttons) delete presenceData.buttons;
    });
});

iTunesEmitter.on("paused", async function(type, currentTrack) {
    if(!currentTrack) return console.log("No track detected");
    ctG = currentTrack;

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
    ctG = undefined;
});

rpc.on("ready", () => {
    disconnected = false;
    ctG = iTunes.getCurrentTrack();

    if(ctG && ctG.playerState === "playing") {
        if(ctG.album.length === 0) presenceData.details = ctG.name;
        else replaceRPCVars(ctG, "rpcDetails");

        replaceRPCVars(ctG, "rpcState");

        if(ctG.duration === 0) {
            presenceData.details = ctG.name;
            presenceData.state = "LIVE";
        }

        checkCover(ctG);
    }

    startCheckInterval();
});

rpc.on("disconnected", () => {
    disconnected = true;
    
    const interval = setInterval(() => {
        if(!disconnected) return clearInterval(interval);
        rpc?.destroy();

        rpc = new DiscordRPC.Client({ transport: "ipc" });
        rpc.login({ clientId: clientId }).catch(() => rpc.destroy());

        rpc.once("ready", () => {
            disconnected = false;
            ctG = iTunes.getCurrentTrack();

            if(ctG && ctG.playerState === "playing") {
                if(ctG.album.length === 0) presenceData.details = ctG.name;
                else replaceRPCVars(ctG, "rpcDetails");
        
                replaceRPCVars(ctG, "rpcState");
        
                if(ctG.duration === 0) {
                    presenceData.details = ctG.name;
                    presenceData.state = "LIVE";
                }
        
                checkCover(ctG);
            }
        
            startCheckInterval();
        });
    }, 1000);
});

let mainWindow;

app.on("ready", () => {
    let tray = new Tray(path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/logo.png")),
        isQuiting,
        autoLaunch = new AutoLaunch({
            name: app.dev ? "AMRPC - DEV" : "AMRPC",
            path: app.getPath("exe")
        }),
        cmenu = Menu.buildFromTemplate([
            { label: `${app.dev ? "AMRPC - DEV" : "AMRPC"} V${app.getVersion()}`, icon: path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/tray/logo@18.png"), enabled: false },
            { type: "separator" },
            { label: langString.tray.restart, click() { app.restart() } },
            { label: langString.tray.checkForUpdates, click() { updateChecker() } },
            { type: "separator" },
            { label: langString.tray.openSettings, click() { mainWindow.show() } },
            { type: "separator" },
            { label: langString.tray.quit, click() { isQuiting = true, app.quit() } }
          ]);

    app.on("quit", () => tray.destroy());
    app.on("before-quit", function () {
        isQuiting = true;
    });

    tray.setToolTip(app.dev ? "AMRPC - DEV" : "AMRPC");
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

    autoUpdater.on('update-available', (info) => {
        console.log('Update available.');
        sendMsgToMainWindow("asynchronous-message", {
            "type": "new-update-available",
            "data": {
                "version": info.version
            }
        });
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('No updates available');
    });

    autoUpdater.on('error', (err) => {
        console.log('Error in auto-updater. ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        sendMsgToMainWindow("asynchronous-message", {
            "type": "download-progress-update",
            "data": {
                "percent": progressObj.percent,
                "transferred": progressObj.transferred,
                "total": progressObj.total,
                "speed": progressObj.bytesPerSecond
            }
        });
    });
    
    autoUpdater.on('update-downloaded', (info) => {
        sendMsgToMainWindow("asynchronous-message", 'Update downloaded');
        autoUpdater.quitAndInstall();
    });

    mainWindow.close();

    updateChecker();

    setInterval(() => {
        updateChecker();
        languageChecker();
    }, 600e3);
});

ipcMain.on("language-change", (e, d) => {
    console.log(`Changed backend language to ${d.lang}`);
    userLang = d.lang;
    langString = require(`./language/${userLang}.json`);
});

function sendMsgToMainWindow(t, v) {
    mainWindow.webContents.send(t, v)
}

function updateChecker() {
    console.log("Checking for updates...");

    autoUpdater.checkForUpdatesAndNotify();

    if(!app.isPackaged) return;

    fetch("https://raw.githubusercontent.com/N0chteil-Productions/Apple-Music-RPC/main/covers.json", {cache: "no-store"}, function(error, meta, body) {
        if(!body) return console.log(`Error ${error}. Cover check was canceled.`);
        body = JSON.parse(body.toString());

        console.log("Checking for new covers...");
        
        if(!isEqual(require("./covers.json"), body)) {
            fs.writeFile(path.join(app.isPackaged ? process.resourcesPath + "/app.asar.unpacked" : __dirname, "/covers.json"), JSON.stringify(body, null, 4), function (err) {if (err) console.log(err)});
            console.log("Updated covers");
            showNotification("AMRPC", langString.notification.coverlistUpdated);
            setTimeout(() => {
                app.relaunch();
                app.exit();
            }, 1000);
        } else console.log("No new covers available");
    });
}

function languageChecker() {
    console.log("Checking for language changes...");

    if(config.get("language") !== userLang) userLang = config.get("language");
}

function showNotification(title, body) {
    new Notification({title: title, body: body, icon: path.join(app.isPackaged ? process.resourcesPath : __dirname, "/assets/logo.png")}).show();
}

function reGetCT(type) {
    let ct = iTunes.getCurrentTrack();
    if(!ct) return console.log("No track detected");

    if(ct.album.length === 0) presenceData.details = ct.name;
    else replaceRPCVars(ct, "rpcDetails");

    replaceRPCVars(ct, "rpcState");
    if(ct.duration > 0) presenceData.endTimestamp = Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration;

    checkCover(ct);

    console.log("action", type);
    console.log("currentTrack.name", ct.name);
    console.log("currentTrack.artist", ct.artist);
    console.log("currentTrack.album", ct.album);
    console.log("timestamp", Math.floor(Date.now() / 1000) - ct.elapsedTime + ct.duration);

    getAppleMusicData(currentTrack.name, currentTrack.artist, function(res, err) {
        if (!err) {
            console.log("currentTrack url", res.url);
            presenceData.buttons = [
                {
                    label: "Play on Apple Music",
                    url: res.url
                }
            ]
        } else if(presenceData.buttons) delete presenceData.buttons;
    });
}
  
function updateShowRPC(status) {
    if(status) reGetCT("update_cfg_show");
    else {
        rpc.clearActivity();
        delete presenceData.details;
        delete presenceData.state;
        delete presenceData.endTimestamp;
    }
    
    config.set("show", status);
}

function isEqual(obj1, obj2) {
    const obj1Keys = Object.keys(obj1),
        obj2Keys = Object.keys(obj2);

    if(obj1Keys.length !== obj2Keys.length) return false;

    for (let objKey of obj1Keys) {
        if (obj1[objKey] !== obj2[objKey]) {
            if(typeof obj1[objKey] == "object" && typeof obj2[objKey] == "object") {
                if(!isEqual(obj1[objKey], obj2[objKey])) return false;
            }
            else return false;
        }
    }

    return true;
}

function checkCover(ct) {
    if(!ct) return;
    if(!config.get("showAlbumCover")) return presenceData.largeImageKey = "applemusic-logo";
    if(appData.get("nineelevenCovers") && (new Date().getMonth() + 1 === 9 && new Date().getDate() === 11)) return presenceData.largeImageKey = "cover_911";

    if(covers.album[ct.album.toLowerCase()]) presenceData.largeImageKey = covers.album[ct.album.toLowerCase()];
    else if(covers.song[ct.artist.toLowerCase()]) {
        if(covers.song[ct.artist.toLowerCase()][ct.name.toLowerCase()]) presenceData.largeImageKey = covers.song[ct.artist.toLowerCase()][ct.name.toLowerCase()];
        else presenceData.largeImageKey = "applemusic-logo";
    } else if(presenceData.largeImageKey !== "applemusic-logo") presenceData.largeImageKey = "applemusic-logo";
}

function replaceRPCVars(ct, cfg) {
    if(!ct || !cfg) return;

    if(cfg === "rpcDetails") presenceData.details = config.get(cfg).replace("%title%", ct.name).replace("%album%", ct.album).replace("%artist%", ct.artist);
    else if(cfg === "rpcState") presenceData.state = config.get(cfg).replace("%title%", ct.name).replace("%album%", ct.album).replace("%artist%", ct.artist);
}

function getAppleMusicData(title, artist, callback) {
    const reqParam = encodeURIComponent(`${title} ${artist}`).replace(/'/g,"%27").replace(/"/g,"%22");

    fetch(`https://itunes.apple.com/search?term=${reqParam}&entity=musicTrack`, {cache: "no-store"}, function(error, meta, body) {
        if(!body) return callback(null, true);
        const res = JSON.parse(body.toString()).results[0];
        if(res) callback({
            url: res.trackViewUrl,
            collectionId: res.collectionId,
            trackId: res.trackId,
            explicit: !res.notExplicit
        });
        else callback(null, true);
    });
}

function startCheckInterval() {
    disconnected = false;
    if(config.get("performanceMode")) {
        const interval = setInterval(() => {
            if(disconnected) return clearInterval(interval);
            if(!presenceData.details) return rpc.clearActivity();
            if(presenceData.details.length > 128) presenceData.details = presenceData.details.substring(0,128);
            if(presenceData.state?.length > 128) presenceData.state = presenceData.state.substring(0,128);
            else if(presenceData.state?.length === 0) delete presenceData.state;
    
            rpc.setActivity(presenceData);
        }, 15);
    } else {
        const interval = setInterval(() => {
            if(disconnected) return clearInterval(interval);
            if(!presenceData.details || !config.get("show")) return rpc.clearActivity();
            if(presenceData.details?.length > 128) presenceData.details = presenceData.details.substring(0,128);
            if(presenceData.state?.length > 128) presenceData.state = presenceData.state.substring(0,128);
            else if(presenceData.state?.length === 0) delete presenceData.state;
            if(presenceData.endTimestamp < Math.floor(Date.now() / 1000)) reGetCT("song_repeat");

            rpc.setActivity(presenceData);
        }, 15);
    }
}

app.restart = () => {
    app.relaunch();
    app.exit();
}

rpc.login({ clientId: clientId }).catch(() => rpc.destroy());