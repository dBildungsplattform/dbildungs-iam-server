export class Page<T> {
    public data: T[];

    public total: number;

    public constructor(data: T[], total: number) {
        this.data = data;
        this.total = total;
    }
}
