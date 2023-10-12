export interface Paged<T> {
    /**
     * The number off items skipped from the start.
     */
    offset: number;

    /**
     * The maximal amount of items that can be fetched with one request.
     */
    limit: number;

    /**
     * The total amount of items tha can be fetched.
     */
    total: number;

    /**
     * The requested items.
     */
    items: T[];
}
