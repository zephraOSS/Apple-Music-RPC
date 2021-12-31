const Store = require("electron-store"),
    { updateActivity, clearActivity } = require("../managers/discord.js"),
    config = new Store({}),
    appData = new Store({ name: "data" }),
    http = require("http");

const requestListener = function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.writeHead(200);
        res.end("end");

        if (req.headers["ame-track"]) {
            req.headers["ame-log"] =
                req.headers["ame-log"] === "true" ? true : false;

            if (req.headers["ame-log"])
                console.log("[AME Server] Received data");

            const track = JSON.parse(decodeURI(req.headers["ame-track"]));

            if (track.type === "paused")
                clearActivity(true, req.headers["ame-log"]);
            else if (track.type === "playing") {
                updateActivity(
                    track.type,
                    {
                        name: track.name,
                        artist: track.artist,
                        album: track.album,
                        duration: track.duration,
                        artwork: track.artwork
                            .replace("{w}", "500")
                            .replace("{h}", "500"),
                        endTime: track.endTime,
                    },
                    "ame",
                    req.headers["ame-log"]
                );
            }
        }
    },
    server = http.createServer(requestListener);

server.listen(941, "localhost", () => {
    console.log("[AME Server] Listening on port 941");
});
