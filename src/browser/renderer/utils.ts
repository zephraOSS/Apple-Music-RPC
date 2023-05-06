import { fetchCacheSize, i18n } from "./index.js";

export let langString: { [key: string]: any } = {};

export function openURL(url) {
    if (url) window.electron.openURL(url);
}

export function generateEleId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    let result = "";

    for (let i = 0; i < characters.length; i++)
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );

    return result;
}

export async function updateTheme(theme?: string) {
    if (!theme) theme = await window.electron.getTheme();

    document.querySelector("body").setAttribute("data-theme", theme);
}

export async function updateLanguage() {
    const languages: Array<string> = await window.electron.getLanguages(),
        userLanguage = await window.electron.config.get("language");

    langString = await window.electron.getLangStrings();

    document.querySelector("select#config_language").innerHTML = "";

    languages.forEach((lang) => {
        const option = document.createElement("option");

        option.value = lang;
        option.innerText = lang;

        document.querySelector("#config_language").appendChild(option);
    });

    document.querySelector<HTMLSelectElement>("select#config_language").value =
        userLanguage;

    document
        .querySelectorAll(".settings_setting label")
        .forEach((ele: HTMLElement) => {
            const ls =
                langString.settings.config[
                    ele.dataset.for?.replace("config_", "") ??
                        ele.getAttribute("for")?.replace("config_", "")
                ];

            if (ls) {
                if (typeof ls === "object") ele.innerHTML = ls["label"];
                else ele.innerHTML = ls;
            }
        });

    document
        .querySelectorAll(
            ".settings_setting select:not(#config_language) option"
        )
        .forEach((ele) => {
            const ls =
                langString.settings.config[
                    ele.parentElement.getAttribute("id").replace("config_", "")
                ]?.[ele.getAttribute("value")];

            if (ls) ele.innerHTML = ls;
        });

    document
        .querySelectorAll(".settings_setting select#config_language option")
        .forEach((ele: HTMLOptionElement) => {
            const optionLang = ele.value.replace("_", "-"),
                optionLangCountry =
                    optionLang.split("-")[1] ?? optionLang.toUpperCase(),
                languageNames = new Intl.DisplayNames([optionLang], {
                    type: "language",
                    languageDisplay: "standard"
                }),
                languageNamesEnglish = new Intl.DisplayNames(["en"], {
                    type: "language",
                    languageDisplay: "standard"
                });

            let nativeLang = languageNames
                .of(optionLang)
                .replace(/\((.*?)\)/, `(${optionLangCountry})`);

            const englishLang = languageNamesEnglish
                .of(optionLang)
                .replace(/\((.*?)\)/, `(${optionLangCountry})`);

            nativeLang =
                nativeLang.charAt(0).toUpperCase() + nativeLang.slice(1);

            ele.textContent =
                nativeLang === englishLang
                    ? nativeLang
                    : `${nativeLang} - ${englishLang}`;
        });

    document.querySelectorAll(".extra span").forEach((ele) => {
        const ls = langString.settings.extra[ele.parentElement.id];

        if (ls) ele.innerHTML = ls;
    });

    document.querySelectorAll("[data-i18n]").forEach((ele: HTMLElement) => {
        const key = ele.dataset.i18n,
            vars = ele.dataset.i18nVars ?? "";

        if (key) ele.innerHTML = i18n.getStringVar(key, vars);
        else {
            console.error("Element with data-i18n attribute has no key", ele);
        }
    });

    fetchCacheSize();
}

export function newNote(
    type: string,
    titleText: string,
    descriptionText: string
) {
    const note = document.createElement("div"),
        title: HTMLHeadingElement = document.createElement("h3"),
        description: HTMLParagraphElement = document.createElement("p");

    note.classList.add("note");
    note.classList.add(`note-${type}`);
    title.classList.add("noteTitle");
    description.classList.add("noteDescription");

    title.innerText = titleText;
    description.innerText = descriptionText;

    note.appendChild(title);
    note.appendChild(description);
    document.querySelector(".notes").appendChild(note);
}
