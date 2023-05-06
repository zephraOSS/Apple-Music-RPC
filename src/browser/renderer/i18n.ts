export class i18n {
    public strings;

    constructor() {
        this.updateTranslation();
    }

    public async updateTranslation() {
        this.strings = await window.electron.getLangStrings();
    }

    public getString(key: string) {
        const keys = key.split(".");

        let value = this.strings;

        for (const k of keys) {
            value = value[k];
        }

        return value;
    }

    public getStringVar(key: string, vars: { [key: string]: any } | string) {
        let string = this.getString(key);

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
