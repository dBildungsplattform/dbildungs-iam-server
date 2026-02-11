import { forwardRef, Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { RolleFactory } from './domain/rolle.factory.js';
import { RollenerweiterungFactory } from './domain/rollenerweiterung.factory.js';
import { RolleRepo } from './repo/rolle.repo.js';
import { RollenerweiterungRepo } from './repo/rollenerweiterung.repo.js';
import { RolleService } from './domain/rolle.service.js';

@Module({
    imports: [forwardRef(() => ServiceProviderModule), LoggerModule.register(RolleModule.name), OrganisationModule],
    providers: [RolleRepo, RolleFactory, RolleService, RollenerweiterungRepo, RollenerweiterungFactory],
    exports: [RolleRepo, RolleFactory, RolleService, RollenerweiterungRepo, RollenerweiterungFactory],
})
export class RolleModule {}
