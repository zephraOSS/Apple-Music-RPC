import { restartRequiredMemory } from "./index.js";
import { updateTheme, updateLanguage } from "./utils.js";

export function init() {
    document
        .querySelector("span.dot.minimize")
        ?.addEventListener("click", window.electron.minimize);

    document
        .querySelector("span.dot.maximize")
        ?.addEventListener("click", window.electron.maximize);

    document
        .querySelector("span.dot.close")
        ?.addEventListener("click", window.electron.hide);

    document
        .querySelectorAll(".settings_setting select")
        .forEach(async (select: HTMLSelectElement) => {
            select.addEventListener("change", async () => {
                console.log(select.id.replace("config_", ""), select.value);

                if (select.dataset.restart === "true") {
                    if (
                        select.value?.toString() ===
                        restartRequiredMemory[select.id]?.toString()
                    ) {
                        delete restartRequiredMemory[select.id];

                        document.querySelector<HTMLSpanElement>(
                            "span#restartApp"
                        ).style["display"] = "none";
                        document.querySelector<HTMLSpanElement>(
                            "span#reloadPage"
                        ).style["display"] = "inline";
                    } else {
                        restartRequiredMemory[select.id] =
                            await window.electron.config.get(
                                select.id.replace("config_", "")
                            );

                        document.querySelector<HTMLSpanElement>(
                            "span#restartApp"
                        ).style["display"] = "inline";
                        document.querySelector<HTMLSpanElement>(
                            "span#reloadPage"
                        ).style["display"] = "none";
                    }
                }

                window.electron.config.set(
                    select.id.replace("config_", ""),
                    select.value === "true" || select.value === "false"
                        ? select.value === "true"
                        : select.value
                );

                if (select.id === "config_colorTheme") updateTheme();
                else if (select.id === "config_language") updateLanguage();
            });

            const configValue = await window.electron.config.get(
                select.id.replace("config_", "")
            );

            if (configValue) {
                select.value = configValue;
                select.classList.remove("cfg_loading");
                select.parentElement.classList.remove("cfg_loading");
            }
        });

    document
        .querySelectorAll(".settings_setting input")
        .forEach(async (input: HTMLInputElement) => {
            if (input.type == "checkbox") {
                input.addEventListener("click", () => {
                    window.electron.config.set(
                        input.id.replace("config_", ""),
                        input.checked
                    );

                    if (input.dataset.restart === "true") {
                        updateSCPM();

                        if (input.checked === restartRequiredMemory[input.id]) {
                            delete restartRequiredMemory[input.id];

                            document.querySelector<HTMLSpanElement>(
                                "span#restartApp"
                            ).style["display"] = "none";
                            document.querySelector<HTMLSpanElement>(
                                "span#reloadPage"
                            ).style["display"] = "inline";
                        } else {
                            restartRequiredMemory[input.id] = !input.checked;

                            document.querySelector<HTMLSpanElement>(
                                "span#restartApp"
                            ).style["display"] = "inline";
                            document.querySelector<HTMLSpanElement>(
                                "span#reloadPage"
                            ).style["display"] = "none";
                        }
                    }

                    if (input.id === "config_autolaunch")
                        window.api.send("autolaunch-change", {});
                });
            } else if (input.type === "text") {
                let timeout;

                input.addEventListener("keyup", function () {
                    clearTimeout(timeout);

                    timeout = setTimeout(function () {
                        window.electron.config.set(
                            input.id.replace("config_", ""),
                            input.value
                        );
                    }, 1500);
                });
            }

            const configValue = await window.electron.config.get(
                input.id.replace("config_", "")
            );

            if (configValue !== undefined) {
                if (input.type === "checkbox") input.checked = configValue;
                else if (input.type === "text") input.value = configValue;

                input.classList.remove("cfg_loading");
                input.parentElement.classList.remove("cfg_loading");
            }
        });
}
