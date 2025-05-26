import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';

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

/**
 *  Reads the environment variable and returns an array of strings.
 * Depending on the input:
 * - undefined or empty string -> undefined
 * - comma-separated string -> array of trimmed strings
 * @param key
 * @returns array of strings or undefined if the environment variable is not set or empty
 */
export function envToStringArray(key: string): string[] | undefined {
    const value: string | undefined = process.env[key];
    if (!value) {
        return undefined;
    }

    return value.split(',').map((item: string) => item.trim()) || undefined;
}

/**
 * Maps an array of strings to an array of RollenArt enums.
 * Filters out any strings that are not valid RollenArt values.
 *
 * @param rollenarten Array of strings representing RollenArt
 * @returns Array of RollenArt enums or undefined if no valid RollenArt found
 */
export function mapStringsToRollenArt(rollenarten: string[]): RollenArt[] | undefined {
    return (
        rollenarten
            .filter((rollenart: string) => Object.values(RollenArt).includes(rollenart as RollenArt))
            .map((rollenart: string) => rollenart as RollenArt) || undefined
    );
}
