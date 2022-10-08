import fetch from "node-fetch";

/**
 * @param path base url is always https://www.zephra.cloud/zaphy/api/
 */
export async function apiRequest(path: string) {
    const res = await fetch(`https://www.zephra.cloud/zaphy/api/${path}`, {
        headers: {
            "User-Agent": "AMRPC"
        }
    });

    return await res.json();
}
