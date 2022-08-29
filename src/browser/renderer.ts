let appVersion,
    restartRequiredMemory = {},
    langString = {},
    platform;

interface Window {
    [key: string]: any;
}

interface LangString {
    [key: string]: any;
}

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

    if (!seenChangelogs[appVersion]) {
        const changelog = await window.electron.fetchChangelog();

        if (changelog) {
            newModal(
                `Changelog ${changelog.name}`,
                // @ts-ignore
                marked.parse(changelog.body.replace("# Changelog:\r\n", "")),
                [
                    {
                        text: (<LangString>langString).settings.modal.buttons
                            .okay,
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

console.log("[BROWSER RENDERER] Loading...");

updateTheme();
updateLanguage();

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

        if (input.type === "checkbox")
            input.checked = await window.electron.config.get(
                input.id.replace("config_", "")
            );
        else if (input.type === "text")
            input.value = await window.electron.config.get(
                input.id.replace("config_", "")
            );
        updateSCPM();
    });

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

        select.value = await window.electron.config.get(
            select.id.replace("config_", "")
        );
    });

function openUrl(url) {
    if (url) window.electron.openURL(url);
}

async function updateTheme(theme?: string) {
    if (!theme) theme = await window.electron.config.get("colorTheme");

    if (theme === "os") theme = await window.electron.getSystemTheme();

    document.querySelector("body").setAttribute("data-theme", theme);
}

async function updateSCPM() {
    const e = {
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

    if (e.performanceMode.checked) {
        if (await window.electron.config.get("show")) e.showRPC.disabled = true;
        e.hideOnPause.checked = true;
        e.hideOnPause.disabled = true;
    } else {
        if (await window.electron.config.get("show"))
            e.showRPC.disabled = false;
        e.hideOnPause.disabled = false;
    }
}

async function updateLanguage() {
    const language = await window.electron.config.get("language");

    langString = await window.electron.getLangStrings(language);

    window.electron.updateLanguage(language);

    document.querySelectorAll(".settings_setting label").forEach((ele) => {
        const ls = (<LangString>langString).settings.config[
            ele.getAttribute("for").replace("config_", "")
        ];

        if (ls) {
            if (typeof ls === "object") ele.textContent = ls["label"];
            else ele.textContent = ls;
        }
    });

    document
        .querySelectorAll(".settings_setting select option")
        .forEach((ele) => {
            const ls = (<LangString>langString).settings.config[
                ele.parentElement.getAttribute("id").replace("config_", "")
            ]?.[ele.getAttribute("value")];

            if (ls) ele.textContent = ls;
        });

    document.querySelectorAll(".extra span").forEach((ele) => {
        const ls = (<LangString>langString).settings.extra[
            ele.parentElement.id
        ];

        if (ls) ele.textContent = ls;
    });
}

function newModal(title, description, buttons) {
    const e = {
        modal: document.createElement("div"),
        title: document.createElement("h1"),
        description: document.createElement("p"),
        body: document.body
    };

    e.body.appendChild(e.modal);
    e.modal.appendChild(e.title);
    e.modal.appendChild(e.description);

    e.modal.classList.add("modal");
    e.title.classList.add("title");
    e.description.classList.add("description");

    e.title.innerHTML = title;
    e.description.innerHTML = description;

    e.modal.id = generateEleId();

    for (let i = 0; i < buttons.length; i++) {
        if (i > 2) return;
        const btn = buttons[i],
            ele = document.createElement("p");

        ele.classList.add("btn");
        ele.classList.add(btn.style);
        if (i === 2) ele.classList.add("btn-last");
        ele.innerHTML = btn.text;

        if (btn.events) {
            for (let i2 = 0; i2 < buttons[i].events.length; i2++) {
                const event = buttons[i].events[i2];

                ele.setAttribute(event.name, event.value);
            }
        }

        e.modal.appendChild(ele);
    }

    document
        .querySelectorAll(".modal a")
        .forEach((element: HTMLAnchorElement) => {
            element.addEventListener("click", function (e) {
                e.preventDefault();
                openUrl(element.href);

                return false;
            });
        });

    if (e.body.classList.contains("modalIsOpen")) {
        e.modal.style.display = "none";
        e.modal.classList.add("awaiting");
    } else e.body.classList.add("modalIsOpen");
}

function closeModal(id) {
    const e = document.querySelector<HTMLDivElement>(`div.modal#${id}`);

    e.style.display = "none";
    document.body.classList.remove("modalIsOpen");

    if (document.querySelector("div.modal.awaiting"))
        openModal(document.querySelector("div.modal.awaiting").id);
}

function openModal(id) {
    const e = document.querySelector<HTMLDivElement>(`div.modal#${id}`);

    e.style.display = "block";

    e.classList.remove("awaiting");
    document.body.classList.add("modalIsOpen");
}

function deleteModal(id) {
    const e = document.querySelector(`div.modal#${id}`);

    e.remove();
    document.body.classList.remove("modalIsOpen");

    if (document.querySelector("div.modal.awaiting"))
        openModal(document.querySelector("div.modal.awaiting").id);
}

function generateEleId() {
    let result = "",
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < characters.length; i++)
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );

    return result;
}

async function updateDataChangelog(k, v) {
    const changelog = await window.electron.appData.get("changelog");

    changelog[k] = v;

    window.electron.appData.set("changelog", changelog);
}

console.log("[BROWSER RENDERER] Ready");
