import Store from "electron-store";
import * as log from "electron-log";

export const config = new Store({
        defaults: {
            autoLaunch: true,
            autoUpdates: process.platform === "win32",
            betaUpdates: false,
            show: true,
            hideOnPause: true,
            artworkPrioLocal: false,
            showAlbumArtwork: true,
            showTimestamps: true,
            hardwareAcceleration: true,
            enableCache: true,
            enableLastFM: false,
            checkIfMusicInstalled: true,
            service: "amp",
            colorTheme: "light",
            language: "en-US",
            artwork: "applemusic-logo",
            rpcLargeImageText: "AMRPC - %version%",
            rpcDetails: "%title% - %album%",
            rpcState: "%artist%",
            lastFM: {
                username: "",
                key: ""
            },
            watchdog: {
                autoUpdates: true,
                mirrorAppState: true
            }
        }
    }),
    appData = new Store({
        name: "data",
        defaults: {
            modals: {
                nineEleven: false,
                appleEvent: false
            },
            nineElevenCovers: false,
            changelog: {},
            zephra: {
                userId: false,
                userAuth: false,
                lastAuth: false
            }
        }
    }),
    // Key format: "songName_:_albumName_:_artistName"
    cache = new Store({
        name: "cache",
        accessPropertiesByDotNotation: false
    });

// Change old language config to new language config
if (config.get("language").includes("_")) config.reset("language");

export function getConfig(key: string): any {
    return config.get(key);
}

export function getAppData(key: string): any {
    return appData.get(key);
}

export function setConfig(key: string, value: any) {
    config.set(key, value);

    log.info("[STORE][CONFIG]", `Set ${key} to ${JSON.stringify(value)}`);
}

export function setAppData(key: string, value: any) {
    appData.set(key, value);

    log.info("[STORE][APPDATA]", `Set ${key} to ${JSON.stringify(value)}`);
}
