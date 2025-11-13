import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { OxService } from './domain/ox.service.js';
import { OxEventHandler } from './domain/ox-event-handler.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { PersonModule } from '../person/person.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { EmailModule } from '../email/email.module.js';
import { OxSyncEventHandler } from './domain/ox-sync-event-handler.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { OxEventService } from './domain/ox-event.service.js';
import { EmailMicroserviceModule } from '../email-microservice/email-microservice.module.js';

@Module({
    imports: [
        OrganisationModule,
        RolleModule,
        PersonModule,
        PersonenKontextModule,
        ServiceProviderModule,
        EmailModule,
        LoggerModule.register(OxModule.name),
        HttpModule,
        EmailMicroserviceModule,
    ],
    providers: [OxService, OxEventService, OxEventHandler, OxSyncEventHandler],
    exports: [OxService, OxEventService],
})
export class OxModule {}
