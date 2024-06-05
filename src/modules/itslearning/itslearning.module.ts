import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ItsLearningIMSESService } from './itslearning.service.js';

@Module({
    imports: [LoggerModule.register(ItsLearningModule.name), HttpModule],
    providers: [ItsLearningIMSESService],
    exports: [ItsLearningIMSESService],
})
export class ItsLearningModule {}
