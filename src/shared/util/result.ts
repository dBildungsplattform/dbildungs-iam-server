/**
 * Creates an Okay-Result from the specified value
 */
export function Ok<E>(): Result<void, E>;
export function Ok<T, E>(value: T): Result<T, E>;
export function Ok<T, E>(value?: unknown): Result<T, E> {
    return {
        ok: true,
        value: value as T,
    };
}

/**
 * Creates an Error-Result from the specified error
 */
export function Err<T, E>(error: E): Result<T, E> {
    return {
        ok: false,
        error,
    };
}

export function Either<Okay extends boolean, T, E>(okay: Okay, value: T, error: E): Result<T, E> {
    return okay ? Ok(value) : Err(error);
}

/**
 * Returns an error-result if the given value is an error, and an okay-result otherwise
 */
export function UnionToResult<U>(union: U): Result<Exclude<U, Error>, Extract<U, Error>> {
    if (union instanceof Error) {
        return Err(union) as Result<Exclude<U, Error>, Extract<U, Error>>;
    } else {
        return Ok(union) as Result<Exclude<U, Error>, Extract<U, Error>>;
    }
}
