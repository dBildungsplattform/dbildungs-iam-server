// import { Specification, SpecificationBase } from './specification-base.js';

// export class AndNotSpecification<T> extends SpecificationBase<T> {
//     public constructor(private readonly left: Specification<T>, private readonly right: Specification<T>) {
//         super();
//     }

//     public override isSatisfiedBy(candidate: T): boolean {
//         return this.left.isSatisfiedBy(candidate) && !this.right.isSatisfiedBy(candidate);
//     }
// }
