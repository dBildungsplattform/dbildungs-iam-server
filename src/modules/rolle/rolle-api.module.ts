import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleController } from './api/rolle.controller.js';
import { RolleModule } from './rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../personenkontext/domain/personenkontext.factory.js';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [
        RolleModule,
        OrganisationModule,
        PersonModule,
        ServiceProviderModule,
        LoggerModule.register(RolleApiModule.name),
    ],
    providers: [DBiamPersonenkontextRepo, PersonenkontextFactory],
    controllers: [RolleController],
})
export class RolleApiModule {}
