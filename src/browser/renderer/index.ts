import { Modal } from "./modal.js";
import { updateTheme, updateLanguage, langString } from "./utils.js";

import { init as initAPI } from "./api.js";
import { init as initListeners } from "./listeners.js";

declare global {
    interface Window {
        electron: any;
        api: any;
    }
}

export let appVersion,
    restartRequiredMemory = {},
    platform;

console.log("[BROWSER][RENDERER] Loading...");

initAPI();
initListeners();

updateTheme();
updateLanguage();

(async () => {
    const seenChangelogs = await window.electron.appData.get("changelog");

    appVersion = await window.electron.appVersion();
    platform = await window.electron.getPlatform();

    document.querySelector("span#extra_version").textContent = `${
        (await window.electron.isDeveloper()) ? "Developer" : ""
    } V.${appVersion}`;

    document
        .querySelectorAll("input[os], option[os]")
        .forEach((ele: HTMLElement) => {
            if (ele.getAttribute("os") !== platform)
                (<HTMLElement>ele.parentNode)?.remove();
        });

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

        if (changelog) {
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
                                value: "updateDataChangelog(appVersion, true), closeModal(this.parentElement.id)"
                            }
                        ]
                    }
                ]
            );
        }
    }
})();

console.log("[BROWSER][RENDERER] Loaded");
