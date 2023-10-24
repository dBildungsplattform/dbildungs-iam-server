import { Module } from '@nestjs/common';
import { RolleService } from './domain/rolle.service.js';
import { RolleModule } from './rolle.module.js';
import { PersonRollenZuweisungRepo } from './repo/person-rollen-zuweisung.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './repo/rollen-berechtigungs-zuweisung.repo.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { RolleRechtRepo } from './repo/rolle-recht.repo.js';
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
