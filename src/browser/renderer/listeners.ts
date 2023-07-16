import {
    fetchCacheSize,
    platform,
    restartRequiredMemory,
    i18n
} from "./index.js";
import { updateTheme } from "./utils.js";

export function init() {
    window.addEventListener("offline", () => {
        document.body.classList.add("offline");
    });

    window.addEventListener("online", () => {
        document.body.classList.remove("offline");
    });

    document
        .querySelector("span.dot.minimize")
        ?.addEventListener("click", window.electron.minimize);

    document
        .querySelector("span.dot.maximize")
        ?.addEventListener("click", window.electron.maximize);

    document
        .querySelector("span.dot.close")
        ?.addEventListener("click", window.electron.hide);

    document.body.addEventListener("click", (e) => {
        if (e.target instanceof HTMLAnchorElement && e.target.href) {
            e.preventDefault();
            window.electron.openURL(e.target.href);
        }
    });

    document.querySelectorAll("#thumbsUp, #thumbsDown").forEach((ele) => {
        ele.addEventListener("click", (e) => {
            window.electron.songDataFeedback(
                (<HTMLElement>e.target).id === "thumbsUp"
            );
        });
    });

    document
        .querySelectorAll(".settings_setting input, select")
        .forEach(async (ele: HTMLInputElement | HTMLSelectElement) => {
            const configKey = ele.id.replace("config_", ""),
                eleTag = ele.tagName.toLowerCase(),
                eleValue = (value?: string | boolean): string | boolean => {
                    if (value) {
                        if (eleTag === "input" && ele.type === "checkbox") {
                            (ele as HTMLInputElement).checked =
                                value as boolean;
                        } else ele.value = value.toString();

                        return;
                    }

                    if (eleTag === "input" && ele.type === "checkbox")
                        return (ele as HTMLInputElement).checked;
                    else return ele.value;
                };

            if (ele.type === "text") {
                let timeout;

                ele.addEventListener("keyup", () => {
                    clearTimeout(timeout);

                    timeout = setTimeout(() => {
                        window.electron.config.set(configKey, eleValue());
                    }, 1500);
                });
            } else {
                ele.addEventListener("change", async () => {
                    const value = eleValue(),
                        configKey = ele.id.replace("config_", "");

                    if (ele.dataset.restart === "true")
                        checkRestartRequired(value, ele.id);

                    window.electron.config.set(configKey, value);

                    valueChangeEvents(ele);
                });
            }

            const configValue = await window.electron.config.get(configKey);

            if (configValue?.toString()) {
                if (ele.id !== "config_language") eleValue(configValue);

                ele.classList.remove("cfg_loading");
                ele.parentElement.classList.remove("cfg_loading");

                if (ele.dataset.restart === "true")
                    restartRequiredMemory[ele.id] = configValue.toString();

                if (ele.id === "config_wakandaForeverMode" && configValue) {
                    const ele: HTMLLinkElement = document.createElement("link");

                    ele.rel = "stylesheet";
                    ele.href = "css/wakandaForever.css";

                    document.head.appendChild(ele);
                }
            }
        });

    document
        .querySelectorAll(".settings_setting button")
        .forEach(async (button: HTMLButtonElement) => {
            button.addEventListener("click", async (e) => {
                e.preventDefault();

                if (
                    !button.dataset.action ||
                    button.classList.contains("disabled")
                )
                    return;

                const Await = button.dataset.await === "true",
                    func = button.dataset.action
                        .split(".")
                        .reduce((o, i) => o[i], window.electron);

                if (!Await) func();
                else {
                    const innerText = button.innerText;

                    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

                    await window.electron[button.dataset.action]();

                    button.innerText = innerText;
                }

                if (button.dataset.action === "resetCache") fetchCacheSize();
            });
        });

    document
        .querySelectorAll(".settings_setting[data-enableReset='true']")
        .forEach((ele) => {
            const formField: HTMLInputElement | HTMLSelectElement =
                    ele.querySelector("input, select"),
                label = ele.querySelector("label:first-of-type");

            const resetButton = document.createElement("span");

            resetButton.classList.add("resetButton");
            resetButton.innerHTML = `<i class="fa-solid fa-arrow-rotate-left" title="Reset to default"></i>`;

            resetButton.addEventListener("click", async () => {
                const configKey = label
                    .getAttribute("for")
                    .replace("config_", "");

                formField.value = await window.electron.config.reset(configKey);
            });

            ele.querySelector(".setting_main").appendChild(resetButton);
        });

    document
        .querySelectorAll(".settings_category[data-restriction-os]")
        .forEach(async (ele: HTMLDivElement) => {
            const restrictOS = ele.dataset.restrictionOs.split(","),
                os = platform ?? (await window.electron.getPlatform());

            if (!restrictOS.includes(os)) ele.remove();
        });

    document
        .querySelectorAll(".settings_setting[data-restriction-os]")
        .forEach(async (ele: HTMLDivElement) => {
            const restrictOS = ele.dataset.restrictionOs.split(","),
                os = platform ?? (await window.electron.getPlatform());

            console.log(restrictOS, os);

            if (!restrictOS.includes(platform)) {
                ele.querySelector(
                    "label.cfgSwitch, select, input"
                ).classList.add("cfg_loading");
            }
        });

    document
        .querySelectorAll(".settings_category[data-restriction-store]")
        .forEach(async (ele: HTMLDivElement) => {
            if (await window.electron.isWindowsStore()) ele.remove();
        });
}

async function checkRestartRequired(
    value: string | boolean,
    id: string
): Promise<void> {
    const restartAppSpan =
            document.querySelector<HTMLSpanElement>("span#restartApp"),
        reloadAppSpan =
            document.querySelector<HTMLSpanElement>("span#reloadPage"),
        isSame = value.toString() === restartRequiredMemory[id];

    restartAppSpan.style["display"] = isSame ? "none" : "inline";
    reloadAppSpan.style["display"] = isSame ? "inline" : "none";
}

function valueChangeEvents(ele): void {
    if (ele.id === "config_colorTheme") updateTheme();
    else if (ele.id === "config_language") i18n.updateLanguage();
    else if (ele.id === "config_autoLaunch")
        window.api.send("autolaunch-change", {});
    else if (ele.id === "config_wakandaForeverMode") {
        if (ele.checked) {
            const ele: HTMLLinkElement = document.createElement("link");

            ele.rel = "stylesheet";
            ele.href = "css/wakandaForever.css";

            document.head.appendChild(ele);
        } else {
            document
                .querySelector<HTMLLinkElement>(
                    "link[href='css/wakandaForever.css']"
                )
                ?.remove();
        }
    }
}
