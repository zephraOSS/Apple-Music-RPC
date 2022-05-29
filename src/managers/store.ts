import Store from "electron-store";
import * as log from "electron-log";

export const config = new Store({
        defaults: {
            autoLaunch: true,
            show: true,
            hideOnPause: true,
            showAlbumArtwork: true,
            performanceMode: false,
            listenTogether: false,
            hardwareAcceleration: true,
            service: "itunes",
            colorTheme: "light",
            language: "en_US",
            artwork: "applemusic-logo",
            rpcDetails: "%title% - %album%",
            rpcState: "%artist%"
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
    });

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
