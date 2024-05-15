import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleController } from './api/rolle.controller.js';
import { RolleModule } from './rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { PersonenkontextAnlageFactory } from '../personenkontext/domain/personenkontext-anlage.factory.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { DBiamPersonenkontextService } from '../personenkontext/domain/dbiam-personenkontext.service.js';

@Module({
    imports: [RolleModule, OrganisationModule, ServiceProviderModule, LoggerModule.register(RolleApiModule.name)],
    providers: [DBiamPersonenkontextRepo, PersonenkontextAnlageFactory, PersonRepo, DBiamPersonenkontextService],
    controllers: [RolleController],
})
export class RolleApiModule {}
