import { config } from "./store";

import * as fs from "fs";
import * as path from "path";
import * as log from "electron-log";

import { JSONParse } from "../utils/json";
import getAppDataPath from "../utils/getAppDataPath";

import type { I18n } from "../../@types/zephra/I18n";

export class i18n {
    public static appDataPath = path.join(getAppDataPath(), "i18n");

    public static onLanguageUpdate(func: (lang: string) => void) {
        config.onDidChange("language", func);
    }

    public static getLangStrings(): I18n | Record<string, never> {
        const filePath = path.join(
            this.appDataPath,
            `${config.get("language")}.json`
        );

        if (!fs.existsSync(filePath)) {
            log.warn(
                "[i18n][getLangStrings]",
                `Translations file (${config.get(
                    "language"
                )}) not found at ${filePath}`
            );

            return {};
        }

        return JSONParse(fs.readFileSync(filePath, "utf8"));
    }

    public static writeLangStrings(lang: string, strings: any) {
        if (!fs.existsSync(this.appDataPath))
            fs.mkdirSync(this.appDataPath, { recursive: true });

        try {
            fs.writeFileSync(
                path.join(this.appDataPath, `${lang}.json`),
                JSON.stringify(strings, null, 4)
            );
        } catch (e) {
            log.error("[i18n][writeLangStrings]", e);
        }
    }

    public static deleteLangDir() {
        if (!fs.existsSync(this.appDataPath)) return;

        fs.rmSync(this.appDataPath, {
            recursive: true
        });
    }

    public static getLanguages() {
        if (!fs.existsSync(this.appDataPath)) return [];

        return fs
            .readdirSync(this.appDataPath)
            .map((file) => file.replace(".json", ""));
    }
}
