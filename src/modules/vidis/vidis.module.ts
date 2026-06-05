import { Module } from '@nestjs/common';
import { VidisApiAdapter } from './adapter/domain/vidis-api.adapter.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(VidisModule.name), HttpModule],
    providers: [VidisApiAdapter],
    exports: [],
    controllers: [],
})
export class VidisModule {}
