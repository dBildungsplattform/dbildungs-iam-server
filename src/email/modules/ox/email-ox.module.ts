import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { OxSendService } from './adapter/technical/ox-send.service.js';
import { OxAdapter } from './adapter/domain/ox.adapter.js';

@Module({
    imports: [LoggerModule.register(EmailOxModule.name), HttpModule],
    providers: [OxSendService, OxAdapter],
    exports: [OxSendService, OxAdapter],
})
export class EmailOxModule {}
