import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { OxSendService } from './domain/ox-send.service.js';
import { OxService } from './domain/ox.service.js';

@Module({
    imports: [LoggerModule.register(EmailOxModule.name), HttpModule],
    providers: [OxSendService, OxService],
    exports: [OxSendService, OxService],
})
export class EmailOxModule {}
