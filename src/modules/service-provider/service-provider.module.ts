import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleService } from './domain/rolle.service.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name)],
    providers: [
        PersonRepo,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
        RolleService,
    ],
    exports: [RolleService, PersonRepo],
})
export class ServiceProviderModule {}
