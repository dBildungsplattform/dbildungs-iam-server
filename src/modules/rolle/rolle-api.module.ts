import { Module } from '@nestjs/common';
import { RolleController } from './api/rolle.controller.js';
import { RolleService } from './domain/rolle.service.js';
import { RolleModule } from './rolle.module.js';
import { PersonRollenZuweisungRepo } from './persistence/person-rollen-zuweisung.repo.js';
import { RollenBerechtigungsZuweisungRepo } from './persistence/rollen-berechtigungs-zuweisung.repo.js';

@Module({
    imports: [RolleModule],
    providers: [RolleService, PersonRollenZuweisungRepo, RollenBerechtigungsZuweisungRepo],
    controllers: [RolleController],
})
export class RolleApiModule {}
