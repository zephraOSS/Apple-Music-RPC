import { cache, config } from "./store";
import { apiRequest } from "../utils/apiRequest";

export class SongData {
    public history: SongDataT[] = [];

    public getSongData(
        title: string,
        album: string,
        artist: string
    ): Promise<SongDataT> {
        return new Promise((resolve, reject) => {
            if (title.includes("Connecting…")) return resolve(null);

            const reqParam = encodeURIComponent(`${title} ${album} ${artist}`)
                    .replace(/"/g, "%27")
                    .replace(/"/g, "%22"),
                cacheItem = cache.get(
                    `${title}_:_${album}_:_${artist}`
                ) as SongDataT;

            if (cacheItem) return resolve(cacheItem);

            apiRequest(
                `search?term=${reqParam}&entity=musicTrack`,
                "https://itunes.apple.com/"
            ).then((r) => {
                if (!r || !r.results?.[0]) return reject("not_found");

                const res = r.results[0],
                    data: SongDataT = {
                        url: res.trackViewUrl,
                        collectionId: res.collectionId,
                        trackId: res.trackId,
                        explicit: !res.notExplicit,
                        artwork: res.artworkUrl100.replace(
                            "100x100bb",
                            "500x500bb"
                        )
                    };

                if (config.get("enableCache"))
                    cache.set(`${title}_:_${album}_:_${artist}`, data);

                this.history.push(data);

                resolve(data);
            });
        });
    }
}
