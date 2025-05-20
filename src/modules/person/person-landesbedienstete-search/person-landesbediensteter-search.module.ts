import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { PersonLandesbediensteterSearchService } from './person-landesbediensteter-search.service.js';
import { PersonModule } from '../person.module.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';
import { EmailModule } from '../../email/email.module.js';

@Module({
    imports: [
        PersonModule,
        PersonenKontextModule,
        EmailModule,
        LoggerModule.register(PersonLandesbediensteterSearchModule.name),
    ],
    providers: [PersonLandesbediensteterSearchService],
    exports: [PersonLandesbediensteterSearchService],
})
export class PersonLandesbediensteterSearchModule {}
