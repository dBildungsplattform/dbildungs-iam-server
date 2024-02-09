import { CompositeSpecification } from './composite-specification.js';
import { Specification } from './specification.js';

export class OrSpecification<T> extends CompositeSpecification<T> {
    public constructor(
        private readonly leftCondition: Specification<T>,
        private readonly rightCondition: Specification<T>,
    ) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return (await this.leftCondition.isSatisfiedBy(t)) || (await this.rightCondition.isSatisfiedBy(t));
    }
}
