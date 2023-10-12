import { Module } from '@nestjs/common';
import { PersonRollenZuweisungRepo } from './persistence/person-rollen-zuweisung.repo.js';
import { RolleService } from './domain/rolle.service.js';
import { PersonRollenZuweisungMapperProfile } from './persistence/person-rollen-zuweisung.mapper.profile.js';
import { RollenBerechtigungsZuweisungRepo } from './persistence/rollen-berechtigungs-zuweisung.repo.js';
import { RolleBerechtigungsZuweisungMapperProfile } from './persistence/rolle-berechtigungs-zuweisung.mapper.profile.js';

@Module({
    providers: [
        PersonRollenZuweisungMapperProfile,
        RolleBerechtigungsZuweisungMapperProfile,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        RolleService,
    ],
    exports: [RolleService],
})
export class RolleModule {}
