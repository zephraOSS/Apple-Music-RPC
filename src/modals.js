if (
    !appData.get("nineelevenAsked") &&
    new Date().getMonth() + 1 === 9 &&
    new Date().getDate() === 11
) {
    newModal(
        langString.settings.modal["911"].title,
        langString.settings.modal["911"].description.replace(
            "%s",
            marked(
                `\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/de/album/drive/255369588')">Where Were You - Alan Jackson</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/4-expanded-edition/626204707')">I Was Here - Beyoncé</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/35-biggest-hits/1452801021')">Courtesy Of The Red, White And Blue - Toby Keith</a>\n* <a class="underline" onclick="openUrl('itmss://music.apple.com/us/album/35-biggest-hits/1452801021')">American Soldier - Toby Keith</a>`
            )
        ),
        [
            {
                text: langString.settings.modal.buttons.okay,
                style: "btn-usaflag",
                events: [
                    {
                        name: "onclick",
                        value: "appData.set('nineElevenCovers', false), appData.set('nineElevenAsked', true), closeModal(this.parentElement.id)"
                    }
                ]
            },
            {
                text: langString.settings.modal["911"].buttons.okcover,
                style: "btn-usaflag",
                events: [
                    {
                        name: "onclick",
                        value: "appData.set('nineElevenCovers', true), appData.set('nineElevenAsked', true), closeModal(this.parentElement.id)"
                    }
                ]
            }
        ]
    );
}

if (
    !appData.get("appleEventAsked") &&
    +new Date("9/14/2021 12:00:00 AM UTC") <= Date.now() &&
    Date.now() < +new Date("9/14/2021 6:30:00 PM UTC")
) {
    const date = new Date("9/14/2021 5:00:00 PM UTC"),
        url = "https://www.apple.com/apple-events/";

    newModal(
        langString.settings.modal["appleEvent"].title,
        langString.settings.modal["appleEvent"].description
            .replace("%d", `${date.getHours()}:00`)
            .replace("%s", `<a onclick="openUrl('${url}')">${url}</a>`),
        [
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
        ]
    );
}
