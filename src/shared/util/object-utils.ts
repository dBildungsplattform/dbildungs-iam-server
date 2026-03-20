type MappingCallback<O extends object, R> = {
    [K in Extract<keyof O, string>]: (key: K, val: NonNullable<O[K]>) => R;
}[Extract<keyof O, string>];

/**
 * Executes the callback for every enumerable string-property  of the object that is not undefined or null and collects the result into an array
 */
export function mapDefinedObjectProperties<O extends object, R>(obj: O, cb: MappingCallback<O, R>): R[] {
    const result: R[] = [];

    for (const prop in obj) {
        const val: O[Extract<keyof O, string>] = obj[prop];
        if (val !== undefined && val !== null) {
            result.push(cb(prop, val));
        }
    }

    return result;
}

/**
 * Returns Object.keys() but with the type set to (keyof O)[].
 * Has the same pitfalls as Object.keys(), so types may not work on complicated object
 */
export function objectKeys<O extends object>(obj: O): (keyof O)[] {
    return Object.keys(obj) as (keyof O)[];
}

/**
 * target[key] = source[key], but typesafe
 */
export function assignSameKey<O, K extends keyof O>(target: O, source: O, key: K): void {
    target[key] = source[key];
}
