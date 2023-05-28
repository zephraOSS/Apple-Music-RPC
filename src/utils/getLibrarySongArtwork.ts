import { Bridge } from "../managers/bridge";
import { JSONParse } from "./json";

import fetch from "node-fetch";
import FormData from "form-data";

import * as fs from "fs";
import * as log from "electron-log";

export function getLibrarySongArtwork(
    artwork = Bridge.getCurrentTrackArtwork()
): Promise<ImgBBResponse["data"] | null> {
    return new Promise(async (resolve, reject) => {
        if (!artwork) return resolve(null);

        const form = new FormData();

        form.append("image", fs.readFileSync(artwork).toString("base64"));
        form.append(
            "name",
            `${Date.now()}-${Math.random().toString().replace(".", "")}`
        );

        const res = await fetch(
            "https://www.zephra.cloud/api/amrpc/image-upload",
            {
                method: "POST",
                headers: {
                    "mime-type": "multipart/form-data"
                },
                body: form
            }
        );

        try {
            const json = JSONParse(await res.text());

            resolve(json?.data);
        } catch (err) {
            log.error("[getLibrarySongArtwork]", err);

            reject();
        }
    });
}
