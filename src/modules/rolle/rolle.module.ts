import { Module } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from './persistence/person-rollen-zuweisung.repo.js';
import { RolleService } from './domain/rolle.service.js';
import { PersonRollenZuweisungMapperProfile } from './persistence/person-rollen-zuweisung.mapper.profile.js';
import { RollenBerechtigungsZuweisungRepo } from './persistence/rollen-berechtigungs-zuweisung.repo.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './persistence/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleMapperProfile } from './persistence/rolle.mapper.profile.js';
import { RolleRechtMapperProfile } from './persistence/rolle-recht.mapper.profile.js';
import { ServiceProviderZugriffMapperProfile } from './persistence/service-provider-zugriff.mapper.profile.js';
import { ServiceProviderRepo } from './persistence/service-provider.repo.js';
import { RolleRechtRepo } from './persistence/rolle-recht.repo.js';
import { ServiceProviderMapperProfile } from './persistence/service-provider.mapper.profile.js';

@Module({
    providers: [
        PersonRollenZuweisungMapperProfile,
        RolleBerechtigungsZuweisungMapperProfile,
        RolleRechtMapperProfile,
        RolleMapperProfile,
        ServiceProviderZugriffMapperProfile,
        ServiceProviderMapperProfile,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
        RolleService,
    ],
    exports: [RolleService],
})
export class RolleModule {}
