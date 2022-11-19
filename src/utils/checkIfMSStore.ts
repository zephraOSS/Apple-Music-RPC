import { app } from "electron";

export function checkIfMSStore() {
    return (
        app.getVersion().replace(/((?!\.).)*/g, "") === "..." &&
        app.getVersion().endsWith(".0")
    );
}
