export abstract class DomainError extends Error {
    public constructor(
        message: string,
        public readonly code: string,
        public readonly details?: unknown[] | Record<string, unknown>,
    ) {
        super(message);
    }
}
