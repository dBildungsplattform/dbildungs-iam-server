export class MeldungValidator {
    public static isMeldungValid(inhalt: string): boolean {
        return inhalt.length > 0 && inhalt.length <= 2000;
    }
}
