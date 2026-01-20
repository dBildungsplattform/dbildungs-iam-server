import { Module } from '@nestjs/common';
import { EventModule } from '../../core/eventbus/index.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonModule } from '../person/person.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationDeleteModule } from './organisation-delete/organisation-delete.module.js';
import { OrganisationModule } from './organisation.module.js';

@Module({
    imports: [
        LoggerModule.register(OrganisationModule.name),
        OrganisationModule,
        EventModule,
        PersonModule,
        RolleModule,
        PersonenKontextModule,
        OrganisationDeleteModule,
    ],
    providers: [],
    controllers: [OrganisationController],
})
export class OrganisationApiModule {}
