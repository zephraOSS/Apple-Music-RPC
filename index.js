const { app, dialog } = require("electron"),
    Store = require("electron-store");

const config = new Store({
        defaults: {
            autolaunch: true,
            show: true,
            hideOnPause: true,
            showAlbumCover: true,
            performanceMode: false,
            listenAlong: false,
            service: "itunes",
            colorTheme: "white",
            language: "en_US",
            cover: "applemusic-logo",
            rpcDetails: "%title% - %album%",
            rpcState: "%artist%",
        },
    }),
    appData = new Store({
        name: "data",
        defaults: {
            nineElevenAsked: false,
            appleEventAsked: false,
            nineElevenCovers: false,
            changelog: {},
            zephra: {
                userId: false,
                userAuth: false,
                lastAuth: false,
            },
        },
    });

console.log = app.addLog;

let langString = require(`./language/${config.get("language")}.json`);

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
require(`./managers/${config.get("service")}.js`);
