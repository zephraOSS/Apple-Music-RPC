import { apiRequest } from "./apiRequest";

export async function checkSupporter(userId: string) {
    const res: APIUserRoles[] = await apiRequest(`user/${userId}/roles`);

    if (!res) return false;

    return res.some(
        (role) =>
            role.id === "1034108574537883708" /* Features+ */ ||
            role.id === "810577364051951648" /* Staff */
    );
}
