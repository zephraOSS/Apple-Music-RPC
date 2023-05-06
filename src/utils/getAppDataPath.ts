import { app } from "electron";

import path from "path";
import fs from "fs";

export default function getAppDataPath() {
    const appPaths = ["AMRPC", "amrpc", "apple-music-rpc"];

    for (const appPath of appPaths) {
        const appDataPath = path.join(app.getPath("appData"), appPath);

        if (fs.existsSync(appDataPath)) return appDataPath;
    }

    return null;
}
