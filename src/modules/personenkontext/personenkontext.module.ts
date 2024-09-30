import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextService } from '../personenkontext/domain/personenkontext.service.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { DBiamPersonenkontextService } from './domain/dbiam-personenkontext.service.js';
import { DbiamPersonenkontextFactory } from './domain/dbiam-personenkontext.factory.js';
import { EventModule } from '../../core/eventbus/index.js';
import { PersonenkontextSpecificationsModule } from './specification/PersonenkontextSpecificationsModule.js';
import { PersonenkontextPersistenceModule } from './persistence/PersonenkontextPersistenceModule.js';

@Module({
    imports: [
        EventModule,
        PersonModule,
        RolleModule,
        OrganisationModule,
        PersonenkontextSpecificationsModule,
        PersonenkontextPersistenceModule,
        LoggerModule.register(PersonenKontextModule.name),
    ],
    providers: [PersonenkontextService, DBiamPersonenkontextService, DbiamPersonenkontextFactory],
    exports: [
        PersonenkontextService,
        DBiamPersonenkontextService,
        DbiamPersonenkontextFactory,
        PersonenkontextPersistenceModule,
        PersonenkontextSpecificationsModule,
    ],
})
export class PersonenKontextModule {}
