import { app } from "electron";
import { config } from "../managers/store";

import * as fs from "fs";
import * as path from "path";

const appDataPath = path.join(getAppDataPath(), "i18n");

export function getLangStrings() {
    const filePath = path.join(appDataPath, `${config.get("language")}.json`);

    if (!fs.existsSync(filePath)) return {};

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeLangStrings(lang: string, strings: any) {
    if (!fs.existsSync(appDataPath))
        fs.mkdirSync(appDataPath, { recursive: true });

    return fs.writeFileSync(
        path.join(appDataPath, `${lang}.json`),
        JSON.stringify(strings, null, 4)
    );
}

export function deleteLangDir() {
    if (!fs.existsSync(appDataPath)) return;

    fs.rmSync(appDataPath, {
        recursive: true
    });
}

export function getLanguages() {
    if (!fs.existsSync(appDataPath)) return [];

    return fs.readdirSync(appDataPath).map((file) => file.replace(".json", ""));
}

function getAppDataPath() {
    const appPaths = ["AMRPC", "amrpc", "apple-music-rpc"];

    for (const appPath of appPaths) {
        const appDataPath = path.join(app.getPath("appData"), appPath);

        if (fs.existsSync(appDataPath)) return appDataPath;
    }

    return null;
}
