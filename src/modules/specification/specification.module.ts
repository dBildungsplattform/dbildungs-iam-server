import { Module } from '@nestjs/common';
import {CompositeSpecification} from "./composite-specification.js";
import {AndSpecification} from "./and-specification.js";
import {OrSpecification} from "./or-specification.js";
import {NotSpecification} from "./not-specification.js";
import {AndNotSpecification} from "./and-not-specification.js";
import {OrNotSpecification} from "./or-not-specification.js";

@Module({
    providers: [],
    exports: [CompositeSpecification, AndSpecification, OrSpecification, NotSpecification, AndNotSpecification, OrNotSpecification],
})
export class SpecificationModule {}
