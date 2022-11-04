import { Modal } from "./modal.js";
import { updateTheme, updateLanguage, langString, openURL } from "./utils.js";

import { init as initAPI } from "./api.js";
import { init as initListeners } from "./listeners.js";
import { init as initEventSettings } from "./eventSettings.js";

declare global {
    interface Window {
        electron: any;
        api: any;
    }
}

export let appVersion,
    restartRequiredMemory = {},
    platform,
    isSupporter: boolean = null,
    isDeveloper: boolean = null;

console.log("[BROWSER][RENDERER] Loading...");

initAPI();
initEventSettings();
initListeners();

updateTheme();
updateLanguage();

(async () => {
    const seenChangelogs = await window.electron.appData.get("changelog");

    appVersion = await window.electron.appVersion();
    platform = await window.electron.getPlatform();
    isSupporter = await window.electron.isSupporter();
    isDeveloper = await window.electron.isDeveloper();

    document.querySelector("span#extra_version").textContent = `${
        isDeveloper ? "Developer" : ""
    } V.${appVersion}`;

    if (isDeveloper) {
        document.querySelector<HTMLInputElement>(
            ".settings_setting input#config_autoLaunch"
        ).disabled = true;
    }

    document
        .querySelectorAll("input[os], option[os]")
        .forEach((ele: HTMLElement) => {
            if (ele.getAttribute("os") !== platform)
                (<HTMLElement>ele.parentNode)?.remove();
        });

    if (isSupporter) {
        document
            .querySelectorAll(".settings_setting_premium")
            .forEach((ele) => {
                const formEle = ele.querySelector("input, select");

                ele.classList.remove("settings_setting_premium");

                if (formEle) formEle.removeAttribute("disabled");
            });
    } else {
        document
            .querySelectorAll(".settings_setting_premium")
            .forEach((ele) => {
                ele.addEventListener("click", () => {
                    new Modal(
                        langString.settings.modal["ko-fi"].title,
                        langString.settings.modal["ko-fi"].description,
                        [
                            {
                                label: langString.settings.modal.buttons.later,
                                style: "btn-grey",
                                events: [
                                    {
                                        name: "click",
                                        type: "delete"
                                    }
                                ]
                            },
                            {
                                label: "Ko-fi",
                                style: "btn-primary",
                                events: [
                                    {
                                        name: "click",
                                        action: () => {
                                            openURL("https://ko-fi.com/zephra");
                                        }
                                    }
                                ]
                            }
                        ]
                    );
                });
            });
    }

    window.electron.getCurrentTrack().then((data) => {
        if (data && data.artwork && data.playerState === "playing") {
            document.querySelector<HTMLImageElement>(".logo").src =
                data.artwork.replace("500x500bb", "40x40bb");
        } else {
            document.querySelector<HTMLImageElement>(".logo").src =
                "../assets/logo.png";
        }
    });

    if (!seenChangelogs[appVersion]) {
        const changelog = await window.electron.fetchChangelog();

        if (changelog && appVersion === changelog.tag_name) {
            new Modal(
                `Changelog ${changelog.name}`,
                // @ts-ignore
                marked.parse(changelog.body.replace("# Changelog:\r\n", "")),
                [
                    {
                        label: langString.settings.modal.buttons.okay,
                        style: "btn-grey",
                        events: [
                            {
                                name: "onclick",
                                value: "updateDataChangelogJS(appVersion, true)",
                                type: "delete"
                            }
                        ]
                    }
                ]
            );
        }
    }
})();

console.log("[BROWSER][RENDERER] Loaded");
