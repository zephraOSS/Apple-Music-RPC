const { app } = require("electron");

export function bounce(type: "informational" | "critical") {
    if (process.platform !== "darwin") return false;

    if (!app.dock.isVisible()) app.dock.show();

    return app.dock.bounce(type);
}
