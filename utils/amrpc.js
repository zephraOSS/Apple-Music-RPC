/**
 * @name AMRPC API
 * @author zephra
 * @description Communicate with AMRPC
 */

class AMRPCPlugin extends AMEPluginHelper {
    Start() {
        this.name = "AMRPC API";

        setInterval(() => {
            this.SendData(false);
        }, 5000);
    }
    OnPlaybackStateChanged() {
        const instance = MusicKit.getInstance(),
            currentTrack = instance?.nowPlayingItem?.attributes;

        if (!instance) return;

        const xhr = new XMLHttpRequest();

        xhr.open("POST", "http://localhost:941", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        if (currentTrack) {
            xhr.setRequestHeader(
                "ame-track",
                encodeURI(
                    JSON.stringify({
                        type:
                            instance.playbackState === 2 ? "playing" : "paused",
                        name: currentTrack.name,
                        artist: currentTrack.artistName,
                        album: currentTrack.albumName,
                        duration: currentTrack.duration
                            ? currentTrack.duration
                            : currentTrack.durationInMillis,
                        artwork: currentTrack.artwork.url,
                        endTime:
                            currentTrack.endTime ??
                            +new Date() + currentTrack.durationInMillis,
                    })
                )
            );
        } else {
            xhr.setRequestHeader(
                "ame-track",
                encodeURI(
                    JSON.stringify({
                        type: "paused",
                    })
                )
            );
        }
        xhr.setRequestHeader("ame-log", true);
        xhr.send();
    }
    SendData(logging = true) {
        const instance = MusicKit.getInstance(),
            currentTrack = instance?.nowPlayingItem?.attributes;

        if (!instance) return;

        const xhr = new XMLHttpRequest();

        xhr.open("POST", "http://localhost:941", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        if (currentTrack) {
            xhr.setRequestHeader(
                "ame-track",
                encodeURI(
                    JSON.stringify({
                        type:
                            instance.playbackState === 2 ? "playing" : "paused",
                        name: currentTrack.name,
                        artist: currentTrack.artistName,
                        album: currentTrack.albumName,
                        duration: currentTrack.duration
                            ? currentTrack.duration
                            : currentTrack.durationInMillis,
                        artwork: currentTrack.artwork.url,
                        endTime: currentTrack.endTime,
                    })
                )
            );
        } else {
            xhr.setRequestHeader(
                "ame-track",
                encodeURI(
                    JSON.stringify({
                        type: "paused",
                    })
                )
            );
        }
        xhr.setRequestHeader("ame-log", logging);
        xhr.send();
    }
}

new AMRPCPlugin();
