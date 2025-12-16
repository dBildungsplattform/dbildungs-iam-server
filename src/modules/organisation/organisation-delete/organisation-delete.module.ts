import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation.module.js';
import { ServiceProviderModule } from '../../service-provider/service-provider.module.js';
import { OrganisationDeleteService } from './organisation-delete.service.js';

@Module({
    imports: [
        LoggerModule.register(OrganisationModule.name),
        EventModule,
        forwardRef(() => OrganisationModule),
        RolleModule,
        PersonenKontextModule,
        ServiceProviderModule,
    ],
    providers: [OrganisationDeleteService],
    exports: [OrganisationDeleteService],
})
export class OrganisationDeleteModule {}
