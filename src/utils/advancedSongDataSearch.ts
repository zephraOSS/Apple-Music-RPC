import fetch from "node-fetch";

import * as cheerio from "cheerio";
import * as log from "electron-log";

export async function songDataSearchStation(title: string) {
    log.info("[songDataSearchStation]", "Searching for", title);

    const res = await fetch(
        `https://music.apple.com/us/search?term=${encodeURIComponent(title)}`,
        {
            headers: {
                "User-Agent": "AMRPC"
            },
            cache: "no-store"
        }
    );

    const html = await res.text();

    const $ = cheerio.load(html);

    const results = $(
        'div[aria-label="Top Results"] > .section-content > ul.grid'
    ).toArray();

    let songData: {
        url?: string;
        artwork?: string;
    } = {};

    results.forEach((result) => {
        if (
            Object.keys(songData).length > 0 ||
            !$(result)
                .find("li.top-search-lockup__secondary")
                .text()
                .includes("Radio Station")
        )
            return;

        const srcSet = $(result)
            .find("div.top-search-lockup__artwork picture source")
            .attr("srcset");

        const artwork = srcSet.split(",")[0].split(" ")[0];

        songData = {
            url: `https://music.apple.com/us/search?term=${encodeURIComponent(
                title
            )}`,
            artwork: artwork.replace("110x110", "512x512")
        };
    });

    return songData;
}
