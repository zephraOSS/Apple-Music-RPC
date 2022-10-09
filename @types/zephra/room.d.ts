import { User } from "discord-rpc";

export interface Room {
    id?: string;
    type?: "create" | "join";
    user?: User;
    song?: any;
    roomId?: string;
    version?: string;
    platform?: string;
}
