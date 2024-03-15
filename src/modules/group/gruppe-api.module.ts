import { Module } from '@nestjs/common';
import { GruppenModule } from './gruppe.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { GruppenController } from './api/gruppe.controller.js';
import { GruppenRepository } from './domain/gruppe.repo.js';
import { GruppenFactory } from './domain/gruppe.factory.js';

@Module({
    imports: [LoggerModule.register(GruppenModule.name), GruppenModule],
    providers: [GruppenRepository, GruppenFactory],
    controllers: [GruppenController],
})
export class GruppenApiModule {}
