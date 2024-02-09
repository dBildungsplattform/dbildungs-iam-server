import { Specification } from './specification.js';
import { OrSpecification } from './or-specification.js';
import { AndSpecification } from './and-specification.js';
import { NotSpecification } from './not-specification.js';
import { AndNotSpecification } from './and-not-specification.js';
import { OrNotSpecification } from './or-not-specification.js';

export abstract class CompositeSpecification<T> implements Specification<T> {
    public abstract isSatisfiedBy(t: T): Promise<boolean>;

    public and(other: Specification<T>): Specification<T> {
        return new AndSpecification(this, other);
    }

    public or(other: Specification<T>): Specification<T> {
        return new OrSpecification(this, other);
    }

    public not(): Specification<T> {
        return new NotSpecification(this);
    }

    public andNot(other: Specification<T>): Specification<T> {
        return new AndNotSpecification(this, other);
    }

    public orNot(other: Specification<T>): Specification<T> {
        return new OrNotSpecification(this, other);
    }
}
