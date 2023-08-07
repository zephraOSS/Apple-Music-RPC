import { i18n } from "./index.js";
import { Modal } from "./modal.js";

export function init() {
    const installUpdateBtn =
        document.querySelector<HTMLButtonElement>("#installUpdate");

    installUpdateBtn.addEventListener("click", () => {
        if (isButtonActive()) window.api.send("update-install");
    });

    window.api.receive("new-update-available", (data) => {
        console.log("[BROWSER RENDERER] New update available", data);

        new Modal(
            i18n.strings.settings.modal["newUpdate"].title,
            i18n.strings.settings.modal["newUpdate"].description.replace(
                "%version%",
                data.version
            ),
            [
                {
                    label: i18n.strings.settings.modal["newUpdate"].buttons
                        .downloadAndInstall,
                    style: "btn-grey",
                    events: [
                        {
                            name: "onclick",
                            value: "window.api.send('update-download', true)"
                        },
                        {
                            name: "click",
                            type: "delete"
                        }
                    ]
                },
                {
                    label: i18n.strings.settings.modal["newUpdate"].buttons
                        .download,
                    style: "btn-grey",
                    events: [
                        {
                            name: "onclick",
                            value: "window.api.send('update-download', false)"
                        },
                        {
                            name: "click",
                            type: "delete"
                        }
                    ]
                },
                {
                    label: i18n.strings.settings.modal.buttons.later,
                    style: "btn-grey",
                    events: [
                        {
                            name: "click",
                            type: "delete"
                        }
                    ]
                }
            ]
        );
    });

    window.api.receive("update-download-progress-update", (_e, data) => {
        document.querySelector<HTMLSpanElement>(
            "span#download-progress"
        ).style.display = data.percent === 100 ? "none" : "inline-block";

        installUpdateBtn.textContent = data.percent;
    });

    window.api.receive("update-downloaded", (_e, data) => {
        installUpdateBtn.setAttribute(
            "data-i18n-vars",
            `version=${data.version}`
        );
        installUpdateBtn.classList.remove("cfg_loading");

        installUpdateBtn.textContent = i18n.getStringVar(
            "settings.config.installUpdate.button",
            installUpdateBtn.getAttribute("data-i18n-vars")
        );

        new Modal(
            i18n.strings.settings.modal["newUpdate"].title,
            i18n.strings.settings.modal[
                "newUpdate"
            ].installed.description.replace("%version%", data.version),
            [
                {
                    label: i18n.strings.settings.modal["newUpdate"].installed
                        .buttons.install,
                    style: "btn-grey",
                    events: [
                        {
                            name: "onclick",
                            value: "window.api.send('update-install', {})"
                        },
                        {
                            name: "click",
                            type: "delete"
                        }
                    ]
                },
                {
                    label: i18n.strings.settings.modal["newUpdate"].installed
                        .buttons.later,
                    style: "btn-grey",
                    events: [
                        {
                            name: "click",
                            type: "delete"
                        }
                    ]
                }
            ]
        );
    });

    function isButtonActive() {
        return !installUpdateBtn.classList.contains("cfg_loading");
    }
}
