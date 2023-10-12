declare type Option<T> = T | null | undefined;

declare type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

declare type Persisted<T, WasPersisted extends boolean> = WasPersisted extends true ? T : Option<T>;

declare type Counted<T> = [T[], number];
