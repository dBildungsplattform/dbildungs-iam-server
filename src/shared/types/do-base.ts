type DOProps = {
    id: string;
};

export abstract class DOBase<T extends DOProps> {
    protected constructor(protected readonly inner: T) {}

    public get id(): string {
        return this.inner.id;
    }

    public get props(): Readonly<T> {
        return this.inner;
    }
}
