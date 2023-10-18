import { Module } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';
import { RolleService } from './domain/rolle.service.js';
import { PersonRollenZuweisungMapperProfile } from './mapper/person-rollen-zuweisung.mapper.profile.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './mapper/rolle-berechtigungs-zuweisung.mapper.profile.js';
import { RolleMapperProfile } from './mapper/rolle.mapper.profile.js';
import { RolleRechtMapperProfile } from './mapper/rolle-recht.mapper.profile.js';
import { ServiceProviderZugriffMapperProfile } from './mapper/service-provider-zugriff.mapper.profile.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
import { ServiceProviderMapperProfile } from './mapper/service-provider.mapper.profile.js';
import {PersonRepo} from "../person/persistence/person.repo.js";

@Module({
    providers: [
        PersonRepo,
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
    exports: [RolleService, PersonRepo],
})
export class RolleModule {}
