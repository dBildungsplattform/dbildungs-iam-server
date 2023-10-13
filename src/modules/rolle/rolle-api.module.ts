import { Module } from '@nestjs/common';
import { RolleService } from './domain/rolle.service.js';
import { RolleModule } from './rolle.module.js';
import { PersonRollenZuweisungRepo } from './persistence/person-rollen-zuweisung.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './persistence/rollen-berechtigungs-zuweisung.repo.js';
import { ServiceProviderRepo } from './persistence/service-provider.repo.js';
import { RolleRechtRepo } from './persistence/rolle-recht.repo.js';
import { ProviderController } from './api/provider.controller.js';

@Module({
    imports: [RolleModule],
    providers: [
        RolleService,
        PersonRollenZuweisungRepo,
        RollenBerechtigungsZuweisungRepo,
        ServiceProviderRepo,
        RolleRechtRepo,
    ],
    controllers: [ProviderController],
})
export class RolleApiModule {}
