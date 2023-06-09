import { Specification, SpecificationBase } from './specification-base.js';

export class NotSpecification<T> extends SpecificationBase<T> {
    public constructor(private readonly other: Specification<T>) {
        super();
    }

    public override isSatisfiedBy(candidate: T): boolean {
        return !this.other.isSatisfiedBy(candidate);
    }
}
