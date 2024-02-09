import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderApiMapperProfile } from './api/provider-api.mapper.profile.js';
import { ProviderController } from './api/provider.controller.js';
import { RolleService } from './domain/rolle.service.js';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { ServiceProviderModule } from './service-provider.module.js';

@Module({
    imports: [ServiceProviderModule, LoggerModule.register(ServiceProviderApiModule.name)],
    providers: [
        RolleService,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
        ProviderApiMapperProfile,
    ],
    controllers: [ProviderController],
})
export class ServiceProviderApiModule {}
