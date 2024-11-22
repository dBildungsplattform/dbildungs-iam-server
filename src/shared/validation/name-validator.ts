export class NameValidator {
    // Regex for no leading or trailing whitespace
    private static readonly NO_LEADING_TRAILING_WHITESPACE: RegExp = /^(?! ).*(?<! )$/;

    // Regex for at least one letter or number
    private static readonly HAS_LETTER_OR_NUMBER: RegExp = /[a-zA-Z0-9]/;

    /**
     * Validates if the name has no leading or trailing whitespace and is not empty.
     * @param name - The name to validate
     * @returns {boolean} - True if valid, otherwise false
     */
    public static isNameValid(name: string): boolean {
        return this.NO_LEADING_TRAILING_WHITESPACE.test(name) && name.trim().length > 0;
    }

    /**
     * Checks if the name has at least one letter or number.
     * @param name - The name to validate
     * @returns {boolean} - True if the name contains a letter or number, otherwise false
     */
    public static hasLetterOrNumber(name: string): boolean {
        return this.HAS_LETTER_OR_NUMBER.test(name);
    }
}
