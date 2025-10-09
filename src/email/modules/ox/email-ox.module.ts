import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { OxSendService } from './domain/ox-send-service.js';

@Module({
    imports: [LoggerModule.register(EmailOxModule.name), HttpModule],
    providers: [OxSendService],
    exports: [OxSendService],
})
export class EmailOxModule {}
