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
        const separator = config
            .replace(/\([^)]*\)/g, "") // Remove all brackets w/ content
            ?.split(/%title%|%album%|%artist%|%year%|%version%/g)
            ?.find((e) => e.length > 0)
            ?.trim()
            ?.replace(/[a-zA-Z0-9 ]/g, "");

        let returnStr = "";

        // e.g. "%title% - %album%" =>
        // "TITLE_IS_AV - ALBUM_IS_AV" or
        // " - ALBUM_IS_AV"
        const testStr = config
            .replace(
                /%title%/g,
                this.currentTrack.name ? "_TITLE_IS_AV_" : "_TITLE_NOT_AV_"
            )
            .replace(
                /%album%/g,
                this.currentTrack.album ? "_ALBUM_IS_AV_" : "_ALBUM_NOT_AV_"
            )
            .replace(
                /%artist%/g,
                this.currentTrack.artist ? "_ARTIST_IS_AV_" : "_ARTIST_NOT_AV_"
            )
            .replace(
                /%year%/g,
                this.currentTrack.releaseYear ? "_YEAR_IS_AV_" : "_YEAR_NOT_AV_"
            )
            .replace(
                /%version%/g,
                app.getVersion() ? "_VERSION_IS_AV_" : "_VERSION_NOT_AV_"
            );

        testStr
            .replace(/\([^)]*_NOT_AV_[^)]*\)/g, "") // Remove all brackets w/ content if variable is not available
            .split(/_[a-zA-Z]*_NOT_AV_|-/g)
            .filter((e) => {
                return e.trim() !== undefined && e.trim() !== "";
            })
            .forEach((e) => {
                e = e.trim();

                const regexBracketsMatch = e.match(/\([^)]+\)/g);

                regexBracketsMatch?.forEach((bracketE) => {
                    const regexMatch =
                            bracketE.match(/_[a-zA-Z]*_IS_AV_|-/g)?.[0] ?? "",
                        cfgElement = regexMatch
                            .replace("_IS_AV_", "")
                            .slice(1)
                            .toLowerCase(),
                        cfgValue = this.getValue(cfgElement);

                    let tempE = e;

                    if (bracketE.includes("_IS_AV_"))
                        tempE = tempE.replace(regexMatch, cfgValue);
                    else tempE = tempE.replace(bracketE, "");

                    e = tempE;
                });

                // e.g. "_TITLE_IS_AV" => "title"
                const regexMatch = e.match(/_[a-zA-Z]*_IS_AV_|-/g)?.[0] ?? "",
                    cfgElement = regexMatch
                        .replace("_IS_AV_", "")
                        .slice(1)
                        .toLowerCase(),
                    cfgValue = this.getValue(cfgElement),
                    regex = new RegExp(`%[a-z]*%|${separator}`, "g");

                if (
                    regexMatch !== "" &&
                    (!cfgElement ||
                        (!cfgValue && e !== config.replace(regex, "").trim()))
                )
                    return;

                if (returnStr) returnStr += ` ${separator} `;

                returnStr +=
                    cfgElement && cfgValue
                        ? e.replace(regexMatch, cfgValue)
                        : e;
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
            case "year":
                return this.currentTrack.releaseYear?.toString();
            case "version":
                return app.isPackaged ? app.getVersion() : "Development";
            default:
                return undefined;
        }
    }
}
