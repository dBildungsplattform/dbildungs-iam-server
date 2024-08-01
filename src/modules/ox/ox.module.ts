import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { OxService } from './domain/ox.service.js';
import { OxEventHandler } from './domain/ox-event-handler.js';

@Module({
    imports: [LoggerModule.register(OxModule.name), HttpModule],
    providers: [OxService, OxEventHandler],
    exports: [OxService],
})
export class OxModule {}
