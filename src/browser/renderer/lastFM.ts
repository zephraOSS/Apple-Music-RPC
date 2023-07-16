import { i18n } from "./index.js";

export async function init() {
    const lastFMUser: {
        username: string;
        key: string;
    } = await window.electron.lastFM.getUser();

    const userBtn = document.querySelector<HTMLButtonElement>(
            ".cfgButton#connectLastFM"
        ),
        toggle = document.querySelector<HTMLInputElement>(
            "#config_enableLastFM"
        );

    if (lastFMUser?.username && lastFMUser?.key)
        userBtn.textContent = lastFMUser.username;
    else if (lastFMUser?.username && !lastFMUser.key)
        userBtn.textContent = "Reconnect";
    else userBtn.textContent = "Connect";

    if (!(await window.electron.config.get("enableLastFM")))
        userBtn.classList.add("disabled");

    toggle.addEventListener("change", () => {
        userBtn.classList[toggle.checked ? "remove" : "add"]("disabled");
    });

    userBtn.addEventListener("click", () => {
        if (userBtn.classList.contains("disabled")) return;

        const strings = i18n.strings;

        switch (userBtn.textContent) {
            case strings.settings.config.lastFMUser.cancel:
                userBtn.textContent = lastFMUser.username;

                break;

            default:
                window.electron.lastFM.connect();
                userBtn.textContent =
                    strings.settings.config.lastFMUser.connecting;

                break;
        }
    });

    userBtn.addEventListener("mouseover", async () => {
        if (userBtn.classList.contains("disabled")) return;

        const strings = await window.electron.getLangStrings();

        switch (userBtn.textContent) {
            case strings.settings.config.lastFMUser.connecting:
                userBtn.textContent = strings.settings.config.lastFMUser.cancel;

                break;

            case lastFMUser.username:
                userBtn.textContent =
                    strings.settings.config.lastFMUser.reconnect;

                break;
        }
    });

    userBtn.addEventListener("mouseout", async () => {
        if (userBtn.classList.contains("disabled")) return;

        const strings = await window.electron.getLangStrings();

        switch (userBtn.textContent) {
            case strings.settings.config.lastFMUser.cancel:
                userBtn.textContent =
                    strings.settings.config.lastFMUser.connecting;

                break;

            case strings.settings.config.lastFMUser.reconnect:
                userBtn.textContent = lastFMUser.username;

                break;
        }
    });

    window.api.receive(
        "lastfm-connect",
        (session: { username: string; key: string }) => {
            userBtn.textContent = session.username;

            lastFMUser.username = session.username;
            lastFMUser.key = session.key;
        }
    );
}
