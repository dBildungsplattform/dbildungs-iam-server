import { forwardRef, Global, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { EscalatedPersonPermissionsFactory } from './escalated-person-permissions.factory.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Global()
@Module({
    imports: [
        LoggerModule.register(PermissionModule.name),
        forwardRef(() => OrganisationModule),
        forwardRef(() => PersonenKontextModule),
    ],
    providers: [EscalatedPersonPermissionsFactory],
    exports: [EscalatedPersonPermissionsFactory],
})
export class PermissionModule {}
