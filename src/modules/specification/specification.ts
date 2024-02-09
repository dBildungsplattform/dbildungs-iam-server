export interface Specification<T> {
    isSatisfiedBy(t: T): Promise<boolean>;
    and(other: Specification<T>): Specification<T>;
    or(other: Specification<T>): Specification<T>;
    not(): Specification<T>;
    andNot(other: Specification<T>): Specification<T>;
    orNot(other: Specification<T>): Specification<T>;
}
