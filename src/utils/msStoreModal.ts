import { app } from "electron";
import { Browser } from "../managers/browser";
import { appData } from "../managers/store";
import { i18n } from "../managers/i18n";

import * as log from "electron-log";

export function init() {
    if (
        process.platform !== "win32" ||
        process.windowsStore ||
        !app.isPackaged ||
        appData.get("modals.msStoreModal")
    )
        return;

    const string = i18n.getLangStrings();

    if (!string) {
        log.warn("[msStoreModal]", "Canceled due to missing language file");
        return;
    }

    const modal: ModalData = {
        title: "Microsoft Store",
        description: string.settings.modal.microsoftStore.description,
        buttons: [
            {
                label: string.settings.modal.microsoftStore.buttons.download,
                style: "btn-primary",
                events: [
                    {
                        name: "onclick",
                        value: "window.electron.openURL('https://amrpc.zephra.cloud#download')"
                    },
                    {
                        name: "click",
                        type: "delete",
                        save: "modals.msStoreModal"
                    }
                ]
            },
            {
                label: string.settings.modal.buttons.close,
                style: "btn-grey",
                events: [
                    {
                        name: "click",
                        type: "delete"
                    }
                ]
            },
            {
                label: string.settings.modal.buttons.no,
                style: "btn-red",
                events: [
                    {
                        name: "click",
                        type: "delete",
                        save: "modals.msStoreModal"
                    }
                ]
            }
        ]
    };

    log.info("[msStoreModal]", "Initializing Microsoft Store modal");

    Browser.send("open-modal", true, modal);
}
