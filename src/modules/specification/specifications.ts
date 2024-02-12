/* eslint-disable max-classes-per-file */

import { CompositeSpecification } from './composite-specification.js';
import { Specification } from './specification.js';

export class AndNotSpecification<T> extends CompositeSpecification<T> {
    public constructor(
        private readonly leftCondition: Specification<T>,
        private readonly rightCondition: Specification<T>,
    ) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return (await this.leftCondition.isSatisfiedBy(t)) && !(await this.rightCondition.isSatisfiedBy(t));
    }
}

export class AndSpecification<T> extends CompositeSpecification<T> {
    public constructor(
        private readonly leftCondition: Specification<T>,
        private readonly rightCondition: Specification<T>,
    ) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return (await this.leftCondition.isSatisfiedBy(t)) && (await this.rightCondition.isSatisfiedBy(t));
    }
}

export class NotSpecification<T> extends CompositeSpecification<T> {
    public constructor(private readonly condition: Specification<T>) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return !(await this.condition.isSatisfiedBy(t));
    }
}

export class OrNotSpecification<T> extends CompositeSpecification<T> {
    public constructor(
        private readonly leftCondition: Specification<T>,
        private readonly rightCondition: Specification<T>,
    ) {
        super();
    }

    public async isSatisfiedBy(t: T): Promise<boolean> {
        return (await this.leftCondition.isSatisfiedBy(t)) || !(await this.rightCondition.isSatisfiedBy(t));
    }
}

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
