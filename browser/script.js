const iTunes = require("itunes-bridge"),
    iTunesEmitter = iTunes.emitter,
    { ipcRenderer } = require('electron'),
    { BrowserWindow, nativeTheme, Notification, app } = require('@electron/remote'),
    Store = require("electron-store"),
    path = require("path"),
    fetch = require("fetch").fetchUrl,
    config = new Store({}),
    appData = new Store({name: "data"}),
    song = {
        name: document.querySelector("#songname"),
        artist: document.querySelector("#songartist"),
        info: document.querySelector("div.songinfo")
    },
    { logInfo, logSuccess, logError } = require("../managers/log");

let langString = require(`../language/${config.get("language")}.json`),
    ctG;

app.dev = (app.isPackaged) ? false : true;

document.querySelector("img#songlogo").src = path.join(app.isPackaged ? process.resourcesPath : `${__dirname}/..`, "/assets/logo.png");
document.querySelector("span#extra_version").textContent = `${app.dev ? "Developer" : ""} V.${app.getVersion()}`;
updateTheme();
updateLanguage();

ipcRenderer.on('asynchronous-message', function (evt, o) {
    if (o.type === "new-update-available") {
        newModal(langString.settings.modal["newUpdate"].title, langString.settings.modal["newUpdate"].description.replace("%version%", o.data.version), [
            {
                text: langString.settings.modal["newUpdate"].buttons.downandinst,
                style: "btn-grey",
                events: [
                    {
                        name: "onclick",
                        value: "ipcRenderer.send('asynchronous-message', {'type': 'download-and-install-update'}), closeModal(this.parentElement.id)"
                    }
                ]
            },
            {
                text: langString.settings.modal["newUpdate"].buttons.download,
                style: "btn-grey",
                events: [
                    {
                        name: "onclick",
                        value: "ipcRenderer.send('asynchronous-message', {'type': 'download-update'}), closeModal(this.parentElement.id)"
                    }
                ]
            }
        ]);
    } else if (o.type === "update-installation-available") {
        newModal(langString.settings.modal["newUpdate"].title, langString.settings.modal["newUpdate"].installed.description.replace("%version%", o.data.version), [
            {
                text: langString.settings.modal["newUpdate"].installed.buttons.install,
                style: "btn-grey",
                events: [
                    {
                        name: "onclick",
                        value: "ipcRenderer.send('asynchronous-message', {'type': 'install-update'}), closeModal(this.parentElement.id)"
                    }
                ]
            },
            {
                text: langString.settings.modal["newUpdate"].installed.buttons.later,
                style: "btn-grey",
                events: [
                    {
                        name: "onclick",
                        value: "closeModal(this.parentElement.id)"
                    }
                ]
            }
        ]);
    } else if (o.type === "download-progress-update") {
        document.querySelector("span#download-progress").style.display = (o.data.percent === 100) ? "none" : "inline-block";
        document.querySelector("span#download-progress progress").value = o.data.percent;
    } else if (o.type === "sendCover") {
        if (ctG.playerState !== "stopped" && o.data.element) {
            const appDataEle = appData.get("discordImg").find(ele => ele.name === o.data.element);

            if (appDataEle)
                document.getElementById("songlogo").src = `https://cdn.discordapp.com/app-assets/842112189618978897/${appDataEle.id}.png`;
            else {
                fetch("https://discord.com/api/oauth2/applications/842112189618978897/assets", function (error, meta, body) {
                    if (!body || error) return console.log(`Error ${error}. Can't access Discord API`);
                    body = JSON.parse(body.toString());
                    let aD = appData.get("discordImg");

                    document.getElementById("songlogo").src = `https://cdn.discordapp.com/app-assets/842112189618978897/${body.find(ele => ele.name === o.data.element).id}.png`;
                    aD = body;
                    appData.set("discordImg", aD);
                });
            }
        }
    }
});

if (!appData.get("userCountUsageAsked")) {
    newModal(langString.settings.modal.usercount.title, langString.settings.modal.usercount.description, [
        {
            text: langString.settings.modal.buttons.yes,
            style: "btn-green",
            events: [
                {
                    name: "onclick",
                    value: "sendUserCount(), appData.set('userCountUsageAsked', true), closeModal(this.parentElement.id)"
                }
            ]
        },
        {
            text: langString.settings.modal.buttons.later,
            style: "btn-grey",
            events: [
                {
                    name: "onclick",
                    value: "deleteModal(this.parentElement.id)"
                }
            ]
        },
        {
            text: langString.settings.modal.buttons.no,
            style: "btn-grey",
            events: [
                {
                    name: "onclick",
                    value: "appData.set('userCountUsageAsked', true), deleteModal(this.parentElement.id)"
                }
            ]
        }
    ]);
}

if (!appData.get("nineelevenAsked") && (new Date().getMonth() + 1 === 9 && new Date().getDate() === 11)) {
    newModal(langString.settings.modal["911"].title, langString.settings.modal["911"].description.replace("%s", marked(`\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/de/album/drive/255369588')">Where Were You - Alan Jackson</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/4-expanded-edition/626204707')">I Was Here - Beyoncé</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/35-biggest-hits/1452801021')">Courtesy Of The Red, White And Blue - Toby Keith</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/35-biggest-hits/1452801021')">American Soldier - Toby Keith</a>`)), [
        {
            text: langString.settings.modal.buttons.okay,
            style: "btn-usaflag",
            events: [
                {
                    name: "onclick",
                    value: "appData.set('nineelevenCovers', false), appData.set('nineelevenAsked', true), closeModal(this.parentElement.id)"
                }
            ]
        },
        {
            text: langString.settings.modal["911"].buttons.okcover,
            style: "btn-usaflag",
            events: [
                {
                    name: "onclick",
                    value: "appData.set('nineelevenCovers', true), appData.set('nineelevenAsked', true), closeModal(this.parentElement.id)"
                }
            ]
        }
    ]);
}

if (!appData.get("appleEventAsked") && (+new Date('9/14/2021 12:00:00 AM UTC') <= Date.now() && Date.now() < +new Date('9/14/2021 6:30:00 PM UTC'))) {
    const date = new Date('9/14/2021 5:00:00 PM UTC'),
        url = "https://www.apple.com/apple-events/"

    newModal(langString.settings.modal["appleEvent"].title, langString.settings.modal["appleEvent"].description.replace("%d", `${date.getHours()}:00`).replace("%s", `<a onclick="openUrl('${url}')">${url}</a>`), [
        {
            text: langString.settings.modal["appleEvent"].buttons.okcool,
            style: "btn-rainbow",
            events: [
                {
                    name: "onclick",
                    value: "appData.set('appleEventAsked', true), closeModal(this.parentElement.id)"
                }
            ]
        }
    ]);
}

if (!appData.get("changelog")[app.getVersion()]) {
    fetch("https://api.github.com/repos/N0chteil-Productions/Apple-Music-RPC/releases/latest", function (error, meta, body) {
        if (!body || error) return console.log(`Error ${error}. Can't get latest release.`);
        body = JSON.parse(body.toString());

        if (body["tag_name"].replace(/\D/g, "") === app.getVersion().replace(/\D/g, "")) {
            newModal(`Changelog ${body.name}`, marked.parse(body.body.replace("# Changelog:\r\n", "")), [
                {
                    text: langString.settings.modal.buttons.okay,
                    style: "btn-grey",
                    events: [
                        {
                            name: "onclick",
                            value: "updateDataChangelog(app.getVersion(), true), closeModal(this.parentElement.id)"
                        }
                    ]
                }
            ]);
        } else
            updateDataChangelog(app.getVersion(), false);
    });
}

iTunesEmitter.on("playing", async function (type, currentTrack) {
    ctG = currentTrack;
    song.name.textContent = (currentTrack.name.length > 40) ? currentTrack.name.substring(0, 40) + "..." : currentTrack.name;
    song.artist.textContent = (currentTrack.artist.length > 40) ? currentTrack.artist.substring(0, 40) + "..." : currentTrack.artist;
    song.info.style.display = "block";

    ipcRenderer.send('getCover', {});
});

iTunesEmitter.on("paused", async function (type, currentTrack) {
    ctG = currentTrack;
    song.name.textContent = "";
    song.artist.textContent = "";
    song.info.style.display = "none";

    document.querySelector("img#songlogo").src = path.join(app.isPackaged ? process.resourcesPath : `${__dirname}/..`, "/assets/logo.png");
});

iTunesEmitter.on("stopped", async function (type, currentTrack) {
    ctG = currentTrack;
    song.name.textContent = "";
    song.artist.textContent = "";
    song.info.style.display = "none";

    document.querySelector("img#songlogo").src = path.join(app.isPackaged ? process.resourcesPath : `${__dirname}/..`, "/assets/logo.png");
});

document.querySelector("span.dot.minimize")?.addEventListener("click", function (e) {
    BrowserWindow.getFocusedWindow().minimize();
});

document.querySelector("span.dot.maximize")?.addEventListener("click", function (e) {
    BrowserWindow.getFocusedWindow().maximize();
});

document.querySelector("span.dot.close")?.addEventListener("click", function (e) {
    BrowserWindow.getFocusedWindow().close();
});

document.querySelectorAll("div.setting input").forEach((input) => {
    if (input.type == "checkbox") {
        input.addEventListener('click', (e) => {
            config.set(input.name.replace("config_", ""), input.checked);

            if (input.getAttribute("rR") === "true") {
                updateSCPM();
                document.querySelector("span#restartApp").style["display"] = "inline";
                document.querySelector("span#reloadPage").style["display"] = "none";
            }
            if (input.name === "config_autolaunch") ipcRenderer.send("autolaunch-change", {});
            if (input.name === "config_show") ipcRenderer.send("showrpc-change", {});
        });
    } else if (input.type === "text") {
        let timeout;

        input.addEventListener('keyup', function (e) {
            clearTimeout(timeout);

            timeout = setTimeout(function () {
                config.set(input.name.replace("config_", ""), input.value);
            }, 1500);
        });
    }

    if (input.type === "checkbox") input.checked = config.get(input.name.replace("config_", ""));
    else if (input.type === "text") input.value = config.get(input.name.replace("config_", ""));
    updateSCPM();
});

document.querySelectorAll("div.setting select").forEach((select) => {
    select.addEventListener('change', (e) => {
        config.set(select.name.replace("config_", ""), select.value);
        console.log(select.name.replace("config_", ""), select.value)
        if (select.name === "config_colorTheme") updateTheme();
        else if (select.name === "config_language") updateLanguage();
    });

    select.value = config.get(select.name.replace("config_", ""));
});

function openUrl(url) {
    if (!url) return;
    require("electron").shell.openExternal(url);
}

function updateTheme() {
    let theme = config.get("colorTheme");

    if (config.get("colorTheme") === "os") theme = nativeTheme.shouldUseDarkColors ? "dark" : "white";
    document.querySelector("body").setAttribute("data-theme", theme);
}

function updateSCPM() {
    const e = {
        cb: document.querySelector("div.setting input[name='config_performanceMode']"),
        cs: document.querySelector("div.setting input[name='config_show']"),
        cp: document.querySelector("div.setting input[name='config_hideOnPause']")
    };

    if (e.cb.checked) {
        if (config.get("show")) e.cs.disabled = true;
        e.cp.checked = true;
        e.cp.disabled = true;
    } else {
        if (config.get("show")) e.cs.disabled = false;
        e.cp.disabled = false;
    }
}

function updateLanguage() {
    const language = config.get("language");

    langString = require(`../language/${language}.json`);

    ipcRenderer.send('language-change', { "lang": language });

    document.querySelectorAll("div.setting label").forEach((ele) => {
        const ls = langString.settings.config[ele.getAttribute("for").replace("config_", "")]
        if (ls) ele.textContent = ls
    });

    document.querySelectorAll(".extra span").forEach((ele) => {
        const ls = langString.settings.extra[ele.parentElement.id]
        if (ls) ele.textContent = ls
    });
}

function newModal(title, description, buttons) {
    const e = {
        modal: document.createElement("div"),
        title: document.createElement("h1"),
        description: document.createElement("p"),
        body: document.body
    }

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

    document.querySelectorAll(".modal a").forEach(element => {
        element.addEventListener("click", function (e) {
            e.preventDefault();
            openUrl(element.href);
    
            return false;
        });
    });

    if (e.body.classList.contains("modalIsOpen")) e.modal.style.display = "none", e.modal.classList.add("awaiting");
    else e.body.classList.add("modalIsOpen");
}

function closeModal(id) {
    const e = document.querySelector(`div.modal#${id}`);
    e.style.display = "none";
    document.body.classList.remove("modalIsOpen");

    if (document.querySelectorAll("div.modal.awaiting").length > 0) openModal(document.querySelectorAll("div.modal.awaiting")[0].id);
}

function openModal(id) {
    const e = document.querySelector(`div.modal#${id}`);
    e.style.display = "block";
    e.classList.remove("awaiting");
    document.body.classList.add("modalIsOpen");
}

function deleteModal(id) {
    const e = document.querySelector(`div.modal#${id}`);
    e.remove();
    document.body.classList.remove("modalIsOpen");

    if (document.querySelectorAll("div.modal.awaiting").length > 0) openModal(document.querySelectorAll("div.modal.awaiting")[0].id);
}

function sendUserCount() {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", "https://amrpc.zephra.cloud/userCount", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
}

function generateEleId() {
    let result = '',
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    for (let i = 0; i < characters.length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));

    return result;
}

function updateDataChangelog(k, v) {
    let changelog = appData.get("changelog");

    changelog[k] = v;

    appData.set("changelog", changelog);
}

app.restart = () => {
    app.relaunch();
    app.exit();
}

function showNotification(title, body) {
    new Notification({ title: title, body: body, icon: path.join(app.isPackaged ? process.resourcesPath : __dirname, "../assets/logo.png") }).show();
}