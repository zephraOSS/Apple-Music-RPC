export let langString: { [key: string]: any } = {};

export function openURL(url) {
    if (url) window.electron.openURL(url);
}

export function generateEleId() {
    let result = "",
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < characters.length; i++)
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );

    return result;
}

export async function updateDataChangelog(k: string, v: string) {
    const changelog = await window.electron.appData.get("changelog");

    changelog[k] = v;

    window.electron.appData.set("changelog", changelog);
}

export async function updateSCPM() {
    const ele = {
        performanceMode: document.querySelector<HTMLInputElement>(
            ".settings_setting input[id='config_performanceMode']"
        ),
        showRPC: document.querySelector<HTMLInputElement>(
            ".settings_setting input[id='config_show']"
        ),
        hideOnPause: document.querySelector<HTMLInputElement>(
            ".settings_setting input[id='config_hideOnPause']"
        )
    };

    if (ele.performanceMode.checked) {
        if (await window.electron.config.get("show"))
            ele.showRPC.disabled = true;

        ele.hideOnPause.checked = true;
        ele.hideOnPause.disabled = true;
    } else {
        if (await window.electron.config.get("show"))
            ele.showRPC.disabled = false;

        ele.hideOnPause.disabled = false;
    }
}

export async function updateTheme(theme?: string) {
    const t = await window.electron.config.get("colorTheme");
    if (!theme) theme = t;
    if (theme === "os") theme = await window.electron.getSystemTheme();

    document.querySelector("body").setAttribute("data-theme", theme);
}

export async function updateLanguage() {
    const language = await window.electron.config.get("language");

    langString = await window.electron.getLangStrings(language);

    await window.electron.updateLanguage(language);

    document
        .querySelectorAll(".settings_setting label")
        .forEach((ele: HTMLElement) => {
            const ls =
                langString.settings.config[
                    ele.dataset.for?.replace("config_", "") ??
                        ele.getAttribute("for")?.replace("config_", "")
                ];

            if (ls) {
                if (typeof ls === "object") ele.textContent = ls["label"];
                else ele.textContent = ls;
            }
        });

    document
        .querySelectorAll(".settings_setting select option")
        .forEach((ele) => {
            const ls =
                langString.settings.config[
                    ele.parentElement.getAttribute("id").replace("config_", "")
                ]?.[ele.getAttribute("value")];

            if (ls) ele.textContent = ls;
        });

    document.querySelectorAll(".extra span").forEach((ele) => {
        const ls = langString.settings.extra[ele.parentElement.id];

        if (ls) ele.textContent = ls;
    });

    document
        .querySelectorAll("[data-translang]")
        .forEach((ele: HTMLElement) => {
            let ls: any = langString,
                key = ele.dataset.translang;

            if (key.includes(".")) {
                key.split(".").forEach((k, i) => {
                    ls = ls[k];

                    if (i === key.split(".").length - 1)
                        if (ls) ele.textContent = ls;
                });
            }
        });
}
