interface currentTrack {
    name: string;
    artist: string;
    album: string;
    mediaKind: string;
    duration: number;
    elapsedTime: number;
    remainingTime: number;
    url: string;
    genre: string;
    releaseYear: number;
    id: number;
    artwork: string;
    playerState?: "playing" | "paused" | "stopped";
}
