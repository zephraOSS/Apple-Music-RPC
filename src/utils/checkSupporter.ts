import { apiRequest } from "./apiRequest";

export async function checkSupporter(userId: string) {
    const res: APIUserRoles[] = await apiRequest(`user/${userId}/roles`);

    return res.some(
        (role) =>
            role.id === "928447423624405002" /* ko-fi */ ||
            role.id === "928447527852843040" /* ko-fi monthly */
    );
}
