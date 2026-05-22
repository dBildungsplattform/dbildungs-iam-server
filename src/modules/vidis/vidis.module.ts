import { Module } from '@nestjs/common';
import { VidisApiService } from './domain/vidis.api-service.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { VidisTestController } from './api/vidis-test.controller.js';
import { VidisSyncService } from './domain/vidis.sync-service.js';

@Module({
    imports: [LoggerModule.register(VidisModule.name), HttpModule],
    providers: [VidisApiService, VidisSyncService],
    exports: [VidisApiService, VidisSyncService],
    controllers: [VidisTestController],
})
export class VidisModule {}
