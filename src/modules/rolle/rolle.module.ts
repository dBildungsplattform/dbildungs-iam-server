import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleRepo } from './repo/rolle.repo.js';

@Module({
    imports: [LoggerModule.register(RolleModule.name)],
    providers: [RolleRepo],
    exports: [RolleRepo],
})
export class RolleModule {}
