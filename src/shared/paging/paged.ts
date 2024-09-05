export interface Paged<T> {
    offset: number;
    limit: number;
    total: number; // Total number of items before applying pagination
    itemsCount?: number; // Number of items returned in the current page (after pagination)
    items: T[];
}
