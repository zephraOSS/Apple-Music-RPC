import { Modal } from "./modal.js";
import { updateTheme, langString } from "./utils.js";

export function init() {
    window.api.receive("update-system-theme", (_e, theme) => {
        console.log(`[BROWSER RENDERER] Changed theme to ${theme}`);

        updateTheme(theme);
    });

    window.api.receive("new-update-available", (data) => {
        console.log("[BROWSER RENDERER] New update available", data);

        new Modal(
            langString.settings.modal["newUpdate"].title,
            langString.settings.modal["newUpdate"].description.replace(
                "%version%",
                data.version
            ),
            [
                {
                    label: langString.settings.modal["newUpdate"].buttons
                        .downandinst,
                    style: "btn-grey",
                    events: [
                        {
                            name: "click",
                            value: "window.api.send('update-download', true)",
                            type: "delete"
                        }
                    ]
                },
                {
                    label: langString.settings.modal["newUpdate"].buttons
                        .download,
                    style: "btn-grey",
                    events: [
                        {
                            name: "click",
                            value: "window.api.send('update-download', false)",
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

        document.querySelector<HTMLProgressElement>(
            "span#download-progress progress"
        ).value = data.percent;
    });

    window.api.receive("update-downloaded", (_e, data) => {
        new Modal(
            langString.settings.modal["newUpdate"].title,
            langString.settings.modal[
                "newUpdate"
            ].installed.description.replace("%version%", data.version),
            [
                {
                    label: langString.settings.modal["newUpdate"].installed
                        .buttons.install,
                    style: "btn-grey",
                    events: [
                        {
                            name: "click",
                            value: "window.api.send('update-install', {})",
                            type: "delete"
                        }
                    ]
                },
                {
                    label: langString.settings.modal["newUpdate"].installed
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

    window.api.receive("get-current-track", (data) => {
        if (data && data.artwork && data.playerState === "playing") {
            document.querySelector<HTMLImageElement>(".logo").src =
                data.artwork.replace("500x500bb", "40x40bb");

            document
                .querySelectorAll("#thumbsUp, #thumbsDown")
                .forEach((ele: HTMLElement) => {
                    ele.style.display = "unset";
                });
        } else {
            document.querySelector<HTMLImageElement>(".logo").src =
                "../assets/logo.png";

            document
                .querySelectorAll("#thumbsUp, #thumbsDown")
                .forEach((ele: HTMLElement) => {
                    ele.style.display = "none";
                });
        }
    });

    window.api.receive("open-modal", async (data) => {
        if (data.i18n) {
            const lang = await window.electron.config.get("language");

            if (data.i18n[lang]) {
                data.title = data.i18n[lang].title;
                data.description = data.i18n[lang].description;

                if (data.buttons.length > 0 && data.i18n[lang].buttons) {
                    data.buttons.forEach((button) => {
                        button.label = data.i18n[lang].buttons[button.label];
                    });
                }
            }
        }

        new Modal(data.title, data.description, data.buttons);
    });

    window.api.receive("url", async (url: string) => {
        console.log("[BROWSER][RENDERER]", "Received URL", url);

        document.getElementById(url).scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
}
