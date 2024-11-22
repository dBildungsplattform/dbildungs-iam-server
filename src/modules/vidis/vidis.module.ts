import { Module } from '@nestjs/common';
import { VidisService } from './vidis.service.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(VidisModule.name), HttpModule],
    providers: [VidisService],
    exports: [VidisService],
})
export class VidisModule {}
