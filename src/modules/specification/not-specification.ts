import { CompositeSpecification } from './composite-specification.js';
import { Specification } from './specification.js';

export class NotSpecification<T> extends CompositeSpecification<T> {
    public constructor(private readonly condition: Specification<T>) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return !(await this.condition.isSatisfiedBy(t));
    }
}
