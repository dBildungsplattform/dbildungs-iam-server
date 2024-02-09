import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleService } from './domain/rolle.service.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { PersonRollenZuweisungMapperProfile } from './mapper/person-rollen-zuweisung.mapper.profile.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleRechtMapperProfile } from './mapper/rolle-recht.mapper.profile.js';
import { ServiceProviderZugriffMapperProfile } from './mapper/service-provider-zugriff.mapper.profile.js';
import { ServiceProviderMapperProfile } from './mapper/service-provider.mapper.profile.js';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name)],
    providers: [
        PersonRepo,
        PersonRollenZuweisungMapperProfile,
        RolleBerechtigungsZuweisungMapperProfile,
        RolleRechtMapperProfile,
        ServiceProviderZugriffMapperProfile,
        ServiceProviderMapperProfile,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
        RolleService,
    ],
    exports: [RolleService, PersonRepo],
})
export class ServiceProviderModule {}
