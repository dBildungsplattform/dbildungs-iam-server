import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ItsLearningIMSESService } from './itslearning.service.js';
import { ItsLearningEventHandler } from './itslearning-event-handler.js';
import { OrganisationModule } from '../organisation/organisation.module.js';

@Module({
    imports: [LoggerModule.register(ItsLearningModule.name), HttpModule, OrganisationModule],
    providers: [ItsLearningIMSESService, ItsLearningEventHandler],
    exports: [ItsLearningIMSESService],
})
export class ItsLearningModule {}
