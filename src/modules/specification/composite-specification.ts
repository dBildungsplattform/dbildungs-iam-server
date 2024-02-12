import { Specification } from './specification.js';
import {
    AndNotSpecification,
    AndSpecification,
    NotSpecification,
    OrNotSpecification,
    OrSpecification,
} from './specifications.js';

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
