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

interface PresenceData {
    details?: string;
    state?: string;
    startTimestamp?: number;
    endTimestamp?: number;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
    partyId?: string;
    partySize?: number;
    partyMax?: number;
    matchSecret?: string;
    joinSecret?: string;
    spectateSecret?: string;
    buttons?: [PresenceDataButton, PresenceDataButton?];
}

interface PresenceDataButton {
    label: string;
    url: string;
}

interface ModalButton {
    label: string;
    style: string;
    events?: ModalButtonEvent[];
}

interface ModalButtonEvent {
    /**
     * The name of the event
     * @example "onclick"
     */
    name: string;
    /**
     * The value of the event
     * @example "closeModal(this.parentElement.id)"
     */
    value?: string;
    type?: "close" | "delete";
    /**
     * The action of the event
     */
    action?: () => void;
}

interface APIUserRoles {
    id: string;
    name: string;
}
