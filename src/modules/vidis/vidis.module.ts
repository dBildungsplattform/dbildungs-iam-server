import { Module } from '@nestjs/common';
import { VidisApiService } from './domain/vidis.api-service.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(VidisModule.name), HttpModule],
    providers: [VidisApiService],
    exports: [VidisApiService],
})
export class VidisModule {}
