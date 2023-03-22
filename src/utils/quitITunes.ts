import { quitITunes as quitAppleBridgeITunes } from "apple-bridge";

import { bridge } from "../index";

export function quitITunes() {
    if (bridge && bridge.scrobbleTimeout) clearTimeout(bridge.scrobbleTimeout);

    quitAppleBridgeITunes();

    if (bridge) bridge.bridge.emit("stopped", "music");
}
