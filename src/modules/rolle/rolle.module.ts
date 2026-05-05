import { forwardRef, Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { RolleDeleteService } from './domain/rolle-delete.service.js';
import { RolleFindService } from './domain/rolle-find.service.js';
import { RolleFactory } from './domain/rolle.factory.js';
import { RollenerweiterungFactory } from './domain/rollenerweiterung.factory.js';
import { RolleRepo } from './repo/rolle.repo.js';
import { RollenerweiterungRepo } from './repo/rollenerweiterung.repo.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Module({
    imports: [
        forwardRef(() => ServiceProviderModule),
        forwardRef(() => PersonenKontextModule),
        LoggerModule.register(RolleModule.name),
        OrganisationModule,
    ],
    providers: [
        RolleRepo,
        RolleFactory,
        RolleFindService,
        RolleDeleteService,
        RollenerweiterungRepo,
        RollenerweiterungFactory,
    ],
    exports: [
        RolleRepo,
        RolleFactory,
        RolleFindService,
        RolleDeleteService,
        RollenerweiterungRepo,
        RollenerweiterungFactory,
    ],
})
export class RolleModule {}
