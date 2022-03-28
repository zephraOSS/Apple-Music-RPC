const fs = require("fs"),
    path = require("path"),
    { app } = require("electron");

console.log = app.addLog;

module.exports = {
    installAMEPlugin() {
        const ameDir = path.join(
                process.env.APPDATA ||
                    (process.platform == "darwin"
                        ? process.env.HOME + "/Library/Preferences"
                        : process.env.HOME + "/.local/share"),
                "/AppleMusic/"
            ),
            pluginDir = path.join(
                process.env.APPDATA ||
                    (process.platform == "darwin"
                        ? process.env.HOME + "/Library/Preferences"
                        : process.env.HOME + "/.local/share"),
                "/AppleMusic/plugins/"
            );

        if (!fs.existsSync(ameDir)) {
            console.log(
                `[PLUGIN] Could not find Apple Music Electron directory! (${ameDir})`
            );

            return false;
        } else {
            if (!fs.existsSync(pluginDir)) {
                console.log(
                    `[PLUGIN] Creating plugin directory... (${pluginDir})`
                );
                fs.mkdirSync(pluginDir);
            }

            fs.copyFile(
                path.join(app.getAppPath(), "utils/amrpc.js"),
                `${pluginDir}amrpc.js`,
                (err) => {
                    if (err) throw err;

                    console.log("[PLUGIN] AMRPC plugin installed!");
                }
            );
        }

        return true;
    }
};
