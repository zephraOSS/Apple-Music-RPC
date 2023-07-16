import { Modal } from "./modal.js";
import { i18n as i18nClass } from "./i18n.js";

import { updateTheme, openURL, newNote } from "./utils.js";

import { init as initAPI } from "./api.js";
import { init as initLastFM } from "./lastFM.js";
import { init as initUpdater } from "./updater.js";
import { init as initListeners } from "./listeners.js";
import { init as initEventSettings } from "./eventSettings.js";

initAPI();

declare global {
    interface Window {
        electron: any;
        api: any;
    }
}

export const restartRequiredMemory = {},
    i18n = new i18nClass();

export let appVersion,
    platform,
    isSupporter: boolean = null,
    isDeveloper: boolean = null,
    appDependencies: {
        music: boolean;
        discord: boolean;
    } = null;

console.log("[BROWSER][RENDERER] Loading...");

initLastFM();
initEventSettings();
initListeners();
initUpdater();

updateTheme();
i18n.updateLanguage();

(async () => {
    const seenChangelogs = await window.electron.appData.get("changelog");

    appVersion = await window.electron.appVersion();
    platform = await window.electron.getPlatform();
    isSupporter = await window.electron.isSupporter();
    isDeveloper = await window.electron.isDeveloper();
    appDependencies = await window.electron.checkAppDependencies();

    document.querySelector("span#extra_version").textContent = `${
        isDeveloper ? "Developer" : ""
    } v${appVersion}`;

    document
        .querySelector("span#extra_version")
        .setAttribute(
            "onclick",
            `window.electron.openURL('https://github.com/ZephraCloud/Apple-Music-RPC/releases/tag/v${appVersion}')`
        );

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

    if (!appDependencies.music) {
        newNote(
            "warn",
            i18n.strings.settings.warn.music.title,
            i18n.strings.settings.warn.music.description
        );
    }

    if (!appDependencies.discord) {
        newNote(
            "warn",
            i18n.strings.settings.warn.discord.title,
            i18n.strings.settings.warn.discord.description
        );
    }

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
                        i18n.strings.settings.modal["ko-fi"].title,
                        i18n.strings.settings.modal["ko-fi"].description,
                        [
                            {
                                label: i18n.strings.settings.modal.buttons
                                    .later,
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
                        label: i18n.strings.settings.modal.buttons.okay,
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

export function fetchCacheSize() {
    window.electron.fetchCacheSize().then((stats) => {
        const ele = document.querySelector("#cacheNoteSize"),
            string: string = i18n.strings.settings.note.cache.size;

        ele.textContent = string
            .replace("%size%", `${stats.fileSize.toFixed(2)} MB`)
            .replace("%count%", stats.size);
    });
}

setInterval(fetchCacheSize, 30000);

console.log("[BROWSER][RENDERER] Loaded");
