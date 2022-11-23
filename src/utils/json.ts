export function JSONParse(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}
