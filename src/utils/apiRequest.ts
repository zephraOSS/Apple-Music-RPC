import { JSONParse } from "./json";

import fetch from "node-fetch";

import * as log from "electron-log";

/**
 * @param path the path to the file
 * @param host host url is https://www.zephra.cloud/zaphy/api/
 */
export async function apiRequest(
    path: string,
    host: string = "https://www.zephra.cloud/zaphy/api/"
) {
    try {
        const res = await fetch(host + path, {
            headers: {
                "User-Agent": "AMRPC"
            }
        });

        return JSONParse(await res.text());
    } catch (e) {
        log.error("[apiRequest]", "Error:", e);
    }
}
