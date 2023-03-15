import { quitITunes as quitAppleBridgeITunes } from "apple-bridge";

import { bridge } from "../index";

export function quitITunes() {
    if (bridge.scrobbleTimeout) clearTimeout(bridge.scrobbleTimeout);

    bridge.bridge.emit("stopped", "music");
    quitAppleBridgeITunes();
    bridge.bridge.emit("stopped", "music");
}
