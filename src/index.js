const { app, dialog } = require("electron"),
    log = require("electron-log"),
    Store = require("electron-store");

app.config = new Store({
    defaults: {
        autolaunch: true,
        show: true,
        hideOnPause: true,
        showAlbumArtwork: true,
        performanceMode: false,
        listenAlong: false,
        hardwareAcceleration: true,
        service: "itunes",
        colorTheme: "light",
        language: "en_US",
        cover: "applemusic-logo",
        rpcDetails: "%title% - %album%",
        rpcState: "%artist%"
    }
});

app.appData = new Store({
    name: "data",
    defaults: {
        nineElevenAsked: false,
        appleEventAsked: false,
        nineElevenCovers: false,
        changelog: {},
        zephra: {
            userId: false,
            userAuth: false,
            lastAuth: false
        }
    }
});

app.dev = app.isPackaged ? false : true;
app.addLog = log.log;
console.log = app.addLog;

let langString = require(`./language/${app.config.get("language")}.json`);

require("child_process").exec("NET SESSION", function (err, so, se) {
    if (se.length === 0) {
        app.isQuiting = true;
        console.log(
            "[Error] Please do not run AMRPC with administrator privileges!"
        );
        dialog.showErrorBox("Oh no!", langString.error.admin);
        app.quit();
    }
});

require("./managers/app.js");
require("./managers/discord.js");
require(`./managers/${app.config.get("service")}.js`);
