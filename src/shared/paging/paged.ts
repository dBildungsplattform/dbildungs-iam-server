export interface Paged<T> {
    offset: number;
    limit: number;
    total: number;
    items: T[];
}
