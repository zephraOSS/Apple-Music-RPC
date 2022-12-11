import otaClient, { Translations } from "@crowdin/ota-client";
import { app } from "electron";

import * as fs from "fs";
import * as path from "path";
import * as log from "electron-log";

/*
 OTA Client info:
 https://www.npmjs.com/package/@crowdin/ota-client#quick-start
 Language codes:
 https://developer.crowdin.com/language-codes/
*/

/**
 * @description Downloads all translations from Crowdin. Use at app start.
 */
export async function init() {
    log.info("[Crowdin]", "Initializing Crowdin OTA Client");

    const client = new otaClient("4e8945ce96a5a9adcee3308fjap");

    return new Promise<void>(async (resolve) => {
        log.info("[Crowdin]", "Downloading translations");

        const translations: Translations = await client.getTranslations(),
            languagePath = path.resolve(
                path.join(
                    process.cwd(),
                    app.isPackaged ? "" : "src",
                    "language"
                )
            );

        if (!translations) {
            resolve();
            return log.warn("[Crowdin]", "No translations available");
        }

        if (fs.existsSync(languagePath)) {
            log.info("[Crowdin]", "Deleting old translations");

            fs.rmSync(languagePath, {
                recursive: true
            });
        }

        for (const locale of Object.keys(translations)) {
            for (const translation of translations[locale]) {
                const filePath = path.join(languagePath, `${locale}.json`),
                    dir = path.dirname(filePath);

                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                fs.writeFileSync(
                    filePath,
                    JSON.stringify(translation.content, null, 2)
                );
            }
        }

        resolve();

        log.info("[Crowdin]", "Finished");
    });
}
