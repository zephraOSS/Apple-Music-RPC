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
                    else if (input.id === "config_wakandaForeverMode") {
                        if (input.checked) {
                            const ele: HTMLLinkElement =
                                document.createElement("link");

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

                if (input.id === "config_wakandaForeverMode" && configValue) {
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

                if (!button.dataset.action) return;

                const Await = button.dataset.await === "true";

                if (!Await) window.electron[button.dataset.action]();
                else {
                    const innerText = button.innerText;

                    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

                    await window.electron[button.dataset.action]();

                    button.innerText = innerText;
                }
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
            resetButton.innerHTML = `<i class="fa-solid fa-arrow-rotate-left"></i>`;

            resetButton.addEventListener("click", async () => {
                const configKey = label
                    .getAttribute("for")
                    .replace("config_", "");

                formField.value = await window.electron.config.reset(configKey);
            });

            ele.appendChild(resetButton);
        });
}
