import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { PersonLandesbediensteterSearchService } from './person-landesbediensteter-search.service.js';

@Module({
    imports: [LoggerModule.register(PersonLandesbediensteterSearchModule.name)],
    providers: [PersonLandesbediensteterSearchService],
    exports: [PersonLandesbediensteterSearchService],
})
export class PersonLandesbediensteterSearchModule {}
