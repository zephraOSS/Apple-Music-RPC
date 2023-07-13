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
