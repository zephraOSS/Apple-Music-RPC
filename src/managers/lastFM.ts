import { shell } from "electron";

import { config } from "./store";
import { Browser } from "./browser";

import LastFMAPI from "lastfmapi";

import * as log from "electron-log";
import * as http from "http";

export class LastFM {
    private lastfm: any;
    private connect: boolean;

    constructor(connect: boolean = false) {
        if (!config.get("enableLastFM")) {
            log.info("[LastFM]", "LastFM is disabled");
            return;
        }

        log.info("[LastFM]", "Initializing LastFM");

        this.connect = connect;
        this.lastfm = new LastFMAPI({
            api_key: "f8f2436148e4ee8f54ffb494ce03cfde",
            secret: "886a030b18072bb4f27cef686aa10d2c"
        });

        this.authenticate();
    }

    async authenticate() {
        const configData: {
            [key: string]: any;
        } = config.get("lastFM");

        if (!this.connect && configData?.username && configData?.key) {
            log.info("[LastFM]", "Loading data from config");

            this.lastfm.setSessionCredentials(
                configData.username,
                configData.key
            );

            return;
        }

        log.info("[LastFM]", "Authenticating with LastFM");

        const authURL = this.lastfm.getAuthenticationUrl({
            cb: "http://localhost:9101/lastfm"
        });

        shell.openExternal(authURL);

        AuthServer.destroy();

        const token = await new AuthServer().create();

        log.info("[LastFM]", "Token received:", token);

        await this.lastfm.authenticate(token, (err: any, session: any) => {
            if (err) return log.error("[LastFM]", err);

            log.info("[LastFM]", "Authenticated with LastFM");

            config.set("lastFM", {
                username: session.username,
                key: session.key
            });

            Browser.send("lastfm-connect", false, session);
        });
    }

    public nowPlaying(data: {
        artist: string;
        track: string;
        album: string;
        duration: number;
    }) {
        if (
            !this.lastfm.sessionCredentials?.username ||
            !this.lastfm.sessionCredentials?.key
        )
            return log.warn("[LastFM]", "No session credentials found");

        this.lastfm.track.updateNowPlaying(data, (err: any) => {
            if (err) {
                log.error("[LastFM]", err);

                if (
                    err.message ===
                    "Invalid session key - Please re-authenticate"
                ) {
                    this.connect = true;
                    this.authenticate();
                }
            }
        });
    }

    public scrobble(data: {
        artist: string;
        track: string;
        album: string;
        duration: number;
        timestamp: number;
    }) {
        if (
            !this.lastfm.sessionCredentials?.username ||
            !this.lastfm.sessionCredentials?.key
        )
            return log.warn("[LastFM]", "No session credentials found");

        this.lastfm.track.scrobble(data, (err: any) => {
            if (err) {
                log.error("[LastFM]", err);

                if (
                    err.message ===
                    "Invalid session key - Please re-authenticate"
                ) {
                    this.connect = true;
                    this.authenticate();
                }
            }
        });
    }
}

class AuthServer {
    private server: any;

    static instance: AuthServer;

    public create(): Promise<string> {
        AuthServer.instance = this;

        return new Promise((resolve, reject) => {
            this.server = http.createServer();

            this.server.listen(9101);
            this.server.on("request", (req: any, res: any) => {
                const url = new URL(req.url, "http://localhost:9101");

                if (url.pathname === "/lastfm") {
                    const query = url.searchParams,
                        token = query.get("token");

                    if (token) {
                        log.info("[LastFM]", "Received token from LastFM");

                        resolve(token);
                    } else reject("No token provided");

                    this.server.close();
                }

                res.end(
                    `<script>window.close()</script><h1>Authentication successful</h1><p>You can close this tab now</p>`
                );
            });
        });
    }

    static destroy() {
        AuthServer.instance?.server.close();
    }
}
