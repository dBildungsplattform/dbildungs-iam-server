import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailReadController } from './email-read.controller.js';

@Module({
    imports: [LoggerModule.register(EmailApiModule.name)],
    providers: [],
    controllers: [EmailReadController],
})
export class EmailApiModule {}
