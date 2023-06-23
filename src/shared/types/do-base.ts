/* eslint-disable max-classes-per-file */
type DOProps = {
    id: string;
};


abstract class DomainObjectBase<Id = string, Persisted extends true | false = false> {
    public abstract get id(): V ;
}

export abstract class DOBase<T extends DOProps> {
    protected constructor(protected readonly inner: T) {}

    public get id(): string {
        return this.inner.id;
    }

    public get props(): Readonly<T> {
        return this.inner;
    }
}
