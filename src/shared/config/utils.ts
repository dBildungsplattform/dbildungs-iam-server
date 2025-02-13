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

/**
 * Reads the environment variable and returns an optional integer.
 * Depending on the input:
 * - undefined or empty string -> undefined
 * - <any valid integer> -> number
 * - string that can't be parsed to an integer -> throws error
 *
 * @param key The name of the environment variable
 */
export function envToOptionalInteger(key: string): number | undefined {
    const value: string | undefined = process.env[key];

    if (!value) {
        return undefined;
    }

    const parsed: number = parseInt(value, 10);

    if (isNaN(parsed)) {
        throw new Error(`Expected environment variable "${key}" to be a valid integer, received "${value}".`);
    }

    return parsed;
}
