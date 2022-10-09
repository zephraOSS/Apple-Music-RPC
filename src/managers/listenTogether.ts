import { app } from "electron";
import { getUserData } from "./discord";
import WebSocket from "ws";
import * as log from "electron-log";

import { Room } from "../../@types/zephra/room";

let socket: WebSocket;
export let room: Room;

function init() {
    socket.addEventListener("open", async () => {
        log.info("[SOCKET]", "Connected");

        setInterval(() => {
            send({
                type: "ping"
            });
        }, 30000);
    });

    socket.addEventListener("message", (data: any) => {
        data = JSON.parse(data.data);

        switch (data.type) {
            case "pong":
                break;

            case "song":
                room.song = data.song;

                break;
        }
    });

    socket.addEventListener("close", () => {
        log.info("[SOCKET]", "Disconnected");
    });
}

function connect() {
    return new WebSocket(
        app.isPackaged
            ? "wss://ws.zephra.cloud/amrpc-lt"
            : "ws://localhost:8443"
    );
}

export function reconnect() {
    socket = connect();

    init();
}

export async function createRoom() {
    console.log("createRoom");
    const user = await getUserData();

    await send(
        JSON.stringify({
            type: "create",
            user,
            version: app.getVersion(),
            platform: process.platform
        } as Room)
    );
}

async function send(data: any) {
    console.log("Send");

    if (!socket) {
        await reconnect();

        socket.on("open", () => {
            socket.send(JSON.stringify(data));
        });
    } else socket.send(JSON.stringify(data));
}
