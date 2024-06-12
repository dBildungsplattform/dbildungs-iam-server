import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { CreateGroupAndRoleHandler } from './service-provider-event-handler.js';
import { CreateGroupAndRoleEvent } from '../../../shared/events/kc-group-and-role-event.js';
import { KeycloakClientError } from '../../../shared/error/index.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

describe('CreateGroupAndRoleHandler', () => {
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;
    let loggerMock: DeepMocked<ClassLogger>;
    let createGroupAndRoleHandler: CreateGroupAndRoleHandler;

    beforeEach(() => {
        keycloakUserServiceMock = createMock<KeycloakUserService>();
        loggerMock = createMock<ClassLogger>();
        createGroupAndRoleHandler = new CreateGroupAndRoleHandler(keycloakUserServiceMock, loggerMock);
    });

    describe('handleCreateGroupAndRoleEvent', () => {
        const groupName: string = 'testGroup';
        const roleName: string = 'testRole';
        const groupId: string = 'groupId';
        const encodedRoleName: string = encodeURIComponent(roleName);
        const event: CreateGroupAndRoleEvent = new CreateGroupAndRoleEvent(groupName, roleName);

        it('should successfully create group, role, and add role to group', async () => {
            keycloakUserServiceMock.createGroup.mockResolvedValue({ ok: true, value: groupId });
            keycloakUserServiceMock.createRole.mockResolvedValue({ ok: true, value: encodedRoleName });
            keycloakUserServiceMock.addRoleToGroup.mockResolvedValue({ ok: true, value: true });

            await createGroupAndRoleHandler.handleCreateGroupAndRoleEvent(event);

            expect(keycloakUserServiceMock.createGroup).toHaveBeenCalledWith(groupName);
            expect(keycloakUserServiceMock.createRole).toHaveBeenCalledWith(roleName);
            expect(keycloakUserServiceMock.addRoleToGroup).toHaveBeenCalledWith(groupId, roleName);
            expect(loggerMock.error).not.toHaveBeenCalled();
        });

        it('should log an error if creating the group fails', async () => {
            keycloakUserServiceMock.createGroup.mockResolvedValue({
                ok: false,
                error: new KeycloakClientError('Group creation failed'),
            });

            await createGroupAndRoleHandler.handleCreateGroupAndRoleEvent(event);

            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Could not create group'));
        });

        it('should log an error if creating the role fails', async () => {
            keycloakUserServiceMock.createGroup.mockResolvedValue({ ok: true, value: groupId });
            keycloakUserServiceMock.createRole.mockResolvedValue({
                ok: false,
                error: new KeycloakClientError('Role creation failed'),
            });

            await createGroupAndRoleHandler.handleCreateGroupAndRoleEvent(event);

            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Could not create role'));
        });

        it('should log an error if adding role to group fails', async () => {
            keycloakUserServiceMock.createGroup.mockResolvedValue({ ok: true, value: groupId });
            keycloakUserServiceMock.createRole.mockResolvedValue({ ok: true, value: encodedRoleName });
            keycloakUserServiceMock.addRoleToGroup.mockResolvedValue({
                ok: false,
                error: new KeycloakClientError('Add role to group failed'),
            });

            await createGroupAndRoleHandler.handleCreateGroupAndRoleEvent(event);

            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Could not add role to group'));
        });
    });
});
