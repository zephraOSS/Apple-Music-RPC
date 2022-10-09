import { generateEleId, openURL } from "./utils.js";

export class Modal {
    private readonly title: string;
    private readonly description: string;
    // @ts-ignore
    private buttons: ModalButton[];

    public modalId: string;

    // @ts-ignore
    constructor(title: string, description: string, buttons: ModalButton[]) {
        const ELE = {
            modal: document.createElement("div"),
            title: document.createElement("h1"),
            description: document.createElement("p"),
            body: document.body
        };

        this.title = title;
        this.description = description;
        this.buttons = buttons;

        ELE.body.appendChild(ELE.modal);
        ELE.modal.appendChild(ELE.title);
        ELE.modal.appendChild(ELE.description);

        ELE.modal.classList.add("modal");
        ELE.title.classList.add("title");
        ELE.description.classList.add("description");

        ELE.title.innerHTML = this.title;
        ELE.description.innerHTML = this.description;

        this.modalId = generateEleId();
        ELE.modal.id = this.modalId;

        for (let i = 0; i < buttons.length; i++) {
            if (i > 2) return;
            const btn = buttons[i],
                ele = document.createElement("p");

            ele.classList.add("btn");
            ele.classList.add(btn.style);

            if (i === 2) ele.classList.add("btn-last");

            ele.innerHTML = btn.label;

            if (btn.events) {
                for (let i2 = 0; i2 < buttons[i].events.length; i2++) {
                    const event = buttons[i].events[i2];

                    if (event.value) ele.setAttribute(event.name, event.value);
                    else if (event.type === "close")
                        ele.addEventListener(event.name, () => this.close());
                    else if (event.type === "delete")
                        ele.addEventListener(event.name, () => this.delete());
                    else if (event.action)
                        ele.addEventListener(event.name, () => event.action());
                }
            }

            ELE.modal.appendChild(ele);
        }

        document
            .querySelectorAll(".modal a")
            .forEach((element: HTMLAnchorElement) => {
                element.addEventListener("click", function (e) {
                    e.preventDefault();
                    openURL(element.href);

                    return false;
                });
            });

        if (ELE.body.classList.contains("modalIsOpen")) {
            ELE.modal.style.display = "none";
            ELE.modal.classList.add("awaiting");
        } else ELE.body.classList.add("modalIsOpen");
    }

    close() {
        Modal.close(this.modalId);
    }

    open() {
        Modal.open(this.modalId);
    }

    delete() {
        Modal.delete(this.modalId);
    }

    static close(id: string) {
        const ele = document.querySelector<HTMLDivElement>(`div.modal#${id}`);

        ele.style.display = "none";

        document.body.classList.remove("modalIsOpen");

        checkForAwaitingModal();
    }

    static open(id: string) {
        const ele = document.querySelector<HTMLDivElement>(`div.modal#${id}`);

        ele.style.display = "block";
        ele.classList.remove("awaiting");

        document.body.classList.add("modalIsOpen");
    }

    static delete(id: string) {
        const ele = document.querySelector(`div.modal#${id}`);

        ele.remove();

        document.body.classList.remove("modalIsOpen");

        checkForAwaitingModal();
    }
}

function checkForAwaitingModal() {
    if (document.querySelector("div.modal.awaiting"))
        Modal.open(document.querySelector("div.modal.awaiting").id);
}
