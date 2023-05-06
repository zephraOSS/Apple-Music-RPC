import { i18n } from "../managers/i18n";

import otaClient, { Translations } from "@crowdin/ota-client";

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

    return new Promise<void>(async (resolve, reject) => {
        log.info("[Crowdin]", "Downloading translations");

        const translations: Translations = await client.getTranslations();

        if (!translations) {
            reject();
            return log.warn("[Crowdin]", "No translations available");
        }

        log.info("[Crowdin]", "Deleting old translations if exist");

        i18n.deleteLangDir();

        for (const locale of Object.keys(translations)) {
            for (const translation of translations[locale]) {
                i18n.writeLangStrings(locale, translation.content);
            }
        }

        resolve();

        log.info("[Crowdin]", "Finished");
    });
}
