declare type Option<T> = T | null | undefined;

declare type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
