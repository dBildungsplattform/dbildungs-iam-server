// TODO
import { createMock } from './createMock.js';
import { Global, Module } from '@nestjs/common';
import { EscalatedPersonPermissionsFactory } from '../../src/modules/permission/escalated-person-permissions.factory.js';

@Global()
@Module({
    providers: [
        {
            provide: EscalatedPersonPermissionsFactory,
            useValue: createMock(EscalatedPersonPermissionsFactory),
        },
    ],
    exports: [EscalatedPersonPermissionsFactory],
})
export class PermissionTestModule {}
