import { getConfig } from "../managers/store";
import { app } from "electron";

export class replaceVariables {
    private currentTrack: currentTrack;

    constructor(currentTrack: currentTrack) {
        this.currentTrack = currentTrack;
    }

    getResult(config: string) {
        return this.testVars(
            getConfig(`rpc${config.charAt(0).toUpperCase() + config.slice(1)}`)
        );
    }

    testVars(config: string) {
        if (!config) return undefined;

        // e.g. "%title% - %album%" => "-"
        const separator =
            config
                .split(/%title%|%album%|%artist%|%version%/g)
                .find((e) => e.length > 0)
                ?.trim()
                ?.replace(/[a-zA-Z0-9 ]/g, "") ?? "-";

        let returnStr = "";

        // e.g. "%title% - %album%" =>
        // "TITLE_IS_AV - ALBUM_IS_AV" or
        // " - ALBUM_IS_AV"
        const testStr = config
            .replace(
                "%title%",
                this.currentTrack.name ? "_TITLE_IS_AV_" : "_TITLE_NOT_AV_"
            )
            .replace(
                "%album%",
                this.currentTrack.album ? "_ALBUM_IS_AV_" : "_TITLE_NOT_AV_"
            )
            .replace(
                "%artist%",
                this.currentTrack.artist ? "_ARTIST_IS_AV_" : "_TITLE_NOT_AV_"
            )
            .replace(
                "%version%",
                app.getVersion() ? "_VERSION_IS_AV_" : "_TITLE_NOT_AV_"
            );

        testStr
            .split(/_[a-zA-Z]*_NOT_AV_|-/g)
            .filter((e) => {
                return e.trim() !== undefined && e.trim() !== "";
            })
            .forEach((e) => {
                e = e.trim();

                // e.g. "TITLE_IS_AV" => "title"
                const cfgElement = e
                        .replace("_IS_AV_", "")
                        .slice(1)
                        .toLowerCase(),
                    cfgValue = this.getValue(cfgElement),
                    regex = new RegExp(`%[a-z]*%|${separator}`, "g");

                if (!cfgValue && e !== config.replace(regex, "").trim()) return;
                if (returnStr) returnStr += ` ${separator} `;

                returnStr += cfgValue ?? e;
            });

        return returnStr ? returnStr.substring(0, 128) : undefined;
    }

    private getValue(variable: string) {
        switch (variable) {
            case "title":
                return this.currentTrack.name;
            case "album":
                return this.currentTrack.album;
            case "artist":
                return this.currentTrack.artist;
            case "version":
                return app.getVersion();
            default:
                return undefined;
        }
    }
}
