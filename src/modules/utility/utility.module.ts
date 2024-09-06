import { Module } from '@nestjs/common';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { PersonModule } from '../../modules/person/person.module.js';
import { PersonenKontextModule } from '../../modules/personenkontext/personenkontext.module.js';
import { EventAdapter } from './event-adapter.js';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [
        LoggerModule.register(UtilityModule.name),
        RolleModule,
        PersonModule,
        OrganisationModule,
        PersonenKontextModule,
    ],
    providers: [EventAdapter],
    exports: [EventAdapter],
})
export class UtilityModule {}
