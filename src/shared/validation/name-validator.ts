export class NameValidator {
    public static isNameValid(name: string): boolean {
        const NO_LEADING_TRAILING_WHITESPACE: RegExp = /^(?! ).*(?<! )$/;
        if (!NO_LEADING_TRAILING_WHITESPACE.test(name) || name.trim().length === 0) {
            return false;
        }
        return true;
    }
}
