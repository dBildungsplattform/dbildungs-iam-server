import { Module } from '@nestjs/common';
import { GruppenModule } from './gruppe.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { GruppenController } from './api/gruppe.controller.js';

@Module({
    imports: [LoggerModule.register(GruppenModule.name), GruppenModule],
    providers: [],
    controllers: [GruppenController],
})
export class GruppenApiModule {}
