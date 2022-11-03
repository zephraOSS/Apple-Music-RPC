import fetch from "node-fetch";

/**
 * @param path the path to the file
 * @param host host url is https://www.zephra.cloud/zaphy/api/
 */
export async function apiRequest(
    path: string,
    host: string = "https://www.zephra.cloud/zaphy/api/"
) {
    const res = await fetch(`${host}${path}`, {
        headers: {
            "User-Agent": "AMRPC"
        }
    });

    return await res.json();
}
