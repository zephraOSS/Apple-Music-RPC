import * as path from "path";

export function getMicrosoftAppInfo(): string | boolean {
    if (!process.windowsStore) return "";

    return (
        __dirname
            .split(path.sep)
            .find((p) => p.includes("62976zephra.AMRPC")) || false
    );
}
