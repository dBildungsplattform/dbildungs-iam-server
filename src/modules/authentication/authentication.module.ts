import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { PersonModule } from '../person/person.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { PersonPermissionsRepo } from './domain/person-permission.repo.js';

@Module({
    imports: [
        LoggerModule.register(AuthenticationModule.name),
        PersonModule,
        PersonenKontextModule,
        OrganisationModule,
        RolleModule,
    ],
    providers: [PersonPermissionsRepo],
    exports: [PersonPermissionsRepo],
})
export class AuthenticationModule {}
