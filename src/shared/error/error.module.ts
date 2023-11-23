import { Module } from '@nestjs/common';
import { DomainToSchulConnexErrorMapper } from './domain-to-schulconnex-error.mapper.js';

@Module({
    providers: [DomainToSchulConnexErrorMapper],
    exports: [DomainToSchulConnexErrorMapper],
})
export class ErrorModule {}
