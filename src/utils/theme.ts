import { Browser } from "../managers/browser";
import { appData } from "../managers/store";
import { AutoTheme } from "electron-autotheme";

export let autoTheme: AutoTheme;

export function init() {
    autoTheme = new AutoTheme((useDark: boolean) => {
        Browser.setTheme(useDark ? "dark" : "light");
    }, appData);
}

export function useDarkMode() {
    return autoTheme.useDarkMode();
}
