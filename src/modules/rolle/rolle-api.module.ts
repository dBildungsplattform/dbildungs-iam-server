import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleService } from './domain/rolle.service.js';
import { RolleModule } from './rolle.module.js';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
import { ProviderController } from './api/provider.controller.js';
import { ProviderApiMapperProfile } from './api/provider-api.mapper.profile.js';
import { RolleController } from './api/rolle.controller.js';

@Module({
    imports: [RolleModule, LoggerModule.register(RolleApiModule.name)],
    providers: [
        RolleService,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
        ProviderApiMapperProfile,
    ],
    controllers: [ProviderController, RolleController],
})
export class RolleApiModule {}
