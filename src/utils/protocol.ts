import { app } from "electron";

import * as path from "path";
import { Browser } from "../managers/browser";

export function init() {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient("amrpc", process.execPath, [
                path.resolve(process.argv[1])
            ]);
        }
    } else {
        app.setAsDefaultProtocolClient("amrpc");
    }

    app.on("second-instance", (_e, commandLine) => {
        let url = commandLine.pop()?.replace("amrpc://", "");

        if (url && url.endsWith("/")) url = url.slice(0, -1);

        if (url === "--allow-file-access-from-files") new Browser();
        else {
            new Browser(url.replace("settings/", ""));
        }
    });

    app.on("open-url", (_e, url) => {
        if (!url) return;

        url = url.replace("amrpc://", "");

        if (url && url.endsWith("/")) url = url.slice(0, -1);

        if (url === "--allow-file-access-from-files") new Browser();
        else {
            new Browser(url.replace("settings/", ""));
        }
    });
}
