import { fetchCacheSize } from "./index.js";

export class i18n {
    public strings;

    constructor() {
        this.updateTranslation();
    }

    public async updateTranslation() {
        this.strings = await window.electron.getLangStrings();
    }

    public async updateLanguage() {
        await this.updateTranslation();

        const languages: Array<string> = await window.electron.getLanguages(),
            userLanguage = await window.electron.config.get("language");

        document.querySelector("select#config_language").innerHTML = "";

        languages.forEach((lang) => {
            const option = document.createElement("option");

            option.value = lang;
            option.innerText = lang;

            document.querySelector("#config_language").appendChild(option);
        });

        document.querySelector<HTMLSelectElement>(
            "select#config_language"
        ).value = userLanguage;

        document
            .querySelectorAll(".settings_setting label")
            .forEach((ele: HTMLElement) => {
                const ls =
                    this.strings.settings.config[
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
                    this.strings.settings.config[
                        ele.parentElement
                            .getAttribute("id")
                            .replace("config_", "")
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
            const ls = this.strings.settings.extra[ele.parentElement.id];

            if (ls) ele.innerHTML = ls;
        });

        document.querySelectorAll("[data-i18n]").forEach((ele: HTMLElement) => {
            const key = ele.dataset.i18n,
                vars = ele.dataset.i18nVars ?? "";

            if (key) {
                const translation = this.getStringVar(key, vars);

                if (translation) ele.innerHTML = translation;
                else {
                    console.error(
                        `Element with data-i18n attribute has no translation for key "${key}"`,
                        ele
                    );
                }
            } else {
                console.error(
                    "Element with data-i18n attribute has no key",
                    ele
                );
            }
        });

        fetchCacheSize();
    }

    public getString(key: string) {
        if (!key) return;

        const keys = key.split(".");

        let value = this.strings;

        for (const k of keys) {
            value = value?.[k];
        }

        return value;
    }

    public getStringVar(key: string, vars: { [key: string]: any } | string) {
        let string = this.getString(key);

        if (!string) return;

        if (typeof vars === "string") vars = this.varConvert(vars);

        for (const k in vars) {
            string = string.replace(`%{${k}}`, vars[k]);
        }

        return string;
    }

    public autoGetString(ele: HTMLElement, key?: string) {
        if (!key) {
            key = (
                ele.dataset.for ??
                ele.parentElement.getAttribute("id") ??
                ele.getAttribute("for")
            )?.replace("config_", "");
        }

        const string = this.getString(key);

        if (!string) return;

        if (typeof string === "object") {
            ele.innerHTML = string["label"];
        }
    }

    /**
     * Convert String variables to Object
     * @param vars
     * @returns {Object}
     * @example varConvert("key1=value1,key2=value2")
     */
    public varConvert(vars: string) {
        const result: { [key: string]: any } = {};

        vars.split(",").forEach((v) => {
            const [key, value] = v.split("=");

            result[key] = value;
        });

        return result;
    }
}
