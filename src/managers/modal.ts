import { Browser } from "./browser";
import { appData } from "./store";
import { apiRequest } from "../utils/apiRequest";
import { CronJob } from "cron";

import * as log from "electron-log";

// https://docs.amrpc.zephra.cloud/developer-resources/modals for more info
export class ModalWatcher {
    constructor() {
        this.checkForModals();
        // :00, :15, :30, :45
        try {
            new CronJob("*/15 * * * *", this.checkForModals).start();
        } catch (e) {
            log.error("[ModalWatcher]", e);
        }
    }

    private checkForModals() {
        log.info("[ModalWatcher][checkForModals] Checking for modals");

        apiRequest("modals.json", "https://api.zephra.cloud/amrpc/").then(
            (data: ModalData[]) => {
                if (!data || Object.keys(data).length === 0) return;

                data.forEach((modal: ModalData) => {
                    if (appData.get("modals")[modal.id]) return;

                    this.openModal(modal);
                });
            }
        );
    }

    private openModal(data: ModalData) {
        if (!data || Object.keys(data).length === 0) return;

        log.info("[ModalWatcher][openModal] Opening modal", data.id);

        Browser.send(
            "open-modal",
            data.priority?.toString() ? data.priority : false,
            data
        );
    }
}
