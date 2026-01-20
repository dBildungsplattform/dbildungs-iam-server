declare type Option<T> = T | null | undefined;

declare type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

declare type Persisted<T, WasPersisted extends boolean> = WasPersisted extends true ? T : Option<T>;

declare type Counted<T> = [T[], number];

declare type Findable<T> = {
    [P in keyof T]?: T[P] extends string | { id: string } | undefined ? string | RegExp | undefined : T[P];
};

// Global TS augmentations to improve typings

// Allows type narrowing using [].filter(Boolean)
interface Array<T> {
    filter<S extends T>(
        predicate: BooleanConstructor,
        // Disable eslint, because "any" is the default type on the standard library
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any,
    ): (S extends false | 0 | '' | null | undefined | 0n ? never : S)[];
}

// Allows type narrowing using [].filter(Boolean)
interface ReadonlyArray<T> {
    filter<S extends T>(
        predicate: BooleanConstructor,
        // Disable eslint, because "any" is the default type on the standard library
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any,
    ): (S extends false | 0 | '' | null | undefined | 0n ? never : S)[];
}
