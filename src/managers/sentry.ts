import * as Sentry from "@sentry/electron";
import * as log from "electron-log";

import { app } from "electron";

export function init() {
    if (!app.isPackaged) return log.info("[SENTRY]", "Sentry is disabled");

    Sentry.init({
        dsn: "https://5da6c0e155b9475299808dd3daa0cf93@o1209127.ingest.sentry.io/6402650",
        environment: /-[a-z]*/g.test(app.getVersion())
            ? app.getVersion().replace(/^(\d+)\.(\d+)\.(\d+)-/g, "")
            : "production"
    });

    log.info("[SENTRY]", "Sentry initialized");
}
