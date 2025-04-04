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
