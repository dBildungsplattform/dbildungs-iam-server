/**
 * Reads the environment variable and returns an optional boolean.
 * Depending on the input:
 * - undefined or empty string -> undefined
 * - "true" (case insensitive) -> true
 * - "false" (case insensitive) -> false
 * - any other string -> throws error
 *
 * @param key The name of the environment variable
 */
export function envToOptionalBoolean(key: string): boolean | undefined {
    const value: string | undefined = process.env[key];

    if (!value) {
        return undefined;
    }

    const lower: string | undefined = value.toLowerCase();

    switch (lower) {
        case 'true':
            return true;
        case 'false':
            return false;
        default:
            throw new Error(`Expected environment variable "${key}" to be "true" or "false", received "${value}".`);
    }
}
