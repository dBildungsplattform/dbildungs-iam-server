import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationModule } from './organisation.module.js';
import { OrganisationUc } from './api/organisation.uc.js';
import { OrganisationApiMapperProfile } from './api/organisation-api.mapper.profile.js';
import { EventModule } from '../../core/eventbus/index.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';

@Module({
    imports: [
        LoggerModule.register(OrganisationModule.name),
        OrganisationModule,
        EventModule,
        PersonModule,
        RolleModule,
    ],
    providers: [OrganisationApiMapperProfile, OrganisationUc, DBiamPersonenkontextRepo, PersonenkontextFactory],
    controllers: [OrganisationController],
})
export class OrganisationApiModule {}
