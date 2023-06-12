// import { AndNotSpecification } from './and-not.specification.js';
// import { AndSpecification } from './and.specification.js';
// import { NotSpecification } from './not.specification.js';
// import { OrNotSpecification } from './or-not.specification.js';
// import { OrSpecification } from './or.specification.js';

// export interface Specification<T> {
//     isSatisfiedBy(candidate: T): boolean;

//     and(other: Specification<T>): Specification<T>;

//     andNot(other: Specification<T>): Specification<T>;

//     or(other: Specification<T>): Specification<T>;

//     orNot(other: Specification<T>): Specification<T>;

//     not(): Specification<T>;
// }

// export abstract class SpecificationBase<T> implements Specification<T> {
//     public abstract isSatisfiedBy(candidate: T): boolean;

//     public and(other: Specification<T>): Specification<T> {
//         return new AndSpecification(this, other);
//     }

//     public andNot(other: Specification<T>): Specification<T> {
//         return new AndNotSpecification(this, other);
//     }

//     public or(other: Specification<T>): Specification<T> {
//         return new OrSpecification(this, other);
//     }

//     public orNot(other: Specification<T>): Specification<T> {
//         return new OrNotSpecification(this, other);
//     }

//     public not(): Specification<T> {
//         return new NotSpecification(this);
//     }
// }
