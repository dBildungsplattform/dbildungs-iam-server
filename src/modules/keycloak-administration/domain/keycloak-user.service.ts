import { Injectable } from '@nestjs/common';
import { GroupRepresentation, KeycloakAdminClient, type UserRepresentation } from '@s3pweb/keycloak-admin-client-cjs';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { DomainError, EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { UserRepresentationDto } from './keycloak-client/user-representation.dto.js';
import { User } from './user.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

export type FindUserFilter = {
    username?: string;
    email?: string;
};

@Injectable()
export class KeycloakUserService {
    public constructor(
        private readonly kcAdminService: KeycloakAdministrationService,

        private readonly logger: ClassLogger,
    ) {}

    public async create(user: User<false>, password?: string): Promise<Result<string, DomainError>> {
        // Get authed client
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        // Check for existing user
        const filter: FindUserFilter = {
            username: user.username,
        };

        if (user.email) {
            filter.email = user.email;
        }

        const findResult: Result<User<true>, DomainError> = await this.findOne(filter);

        if (findResult.ok) {
            return {
                ok: false,
                error: new KeycloakClientError('Username or email already exists'),
            };
        }

        // Create user
        try {
            const userRepresentation: UserRepresentation = {
                username: user.username,
                enabled: true,
                attributes: user.externalSystemIDs,
            };

            if (user.email) {
                userRepresentation.email = user.email;
            }

            if (password) {
                userRepresentation.credentials = [{ type: 'password', value: password, temporary: false }];
            }

            const response: { id: string } = await kcAdminClientResult.value.users.create(userRepresentation);

            return { ok: true, value: response.id };
        } catch (err) {
            this.logger.error(`Could not create user, message: ${JSON.stringify(err)} `);
            return { ok: false, error: new KeycloakClientError('Could not create user') };
        }
    }

    public async createWithHashedPassword(
        user: User<false>,
        hashedPassword: string,
    ): Promise<Result<string, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }
        let algorithm: string;
        let hashIterations: number | undefined;
        let passwordValue: string;
        if (hashedPassword.startsWith('{BCRYPT}')) {
            algorithm = 'bcrypt';
            const parts: string[] = hashedPassword.split('$'); //Only Everything After and including the First $
            if (parts.length < 4 || !parts[2]) {
                return {
                    ok: false,
                    error: new KeycloakClientError('Invalid bcrypt hash format'),
                };
            }
            hashIterations = parseInt(parts[2]);
            passwordValue = hashedPassword.substring(hashedPassword.indexOf('$'));
        } else if (hashedPassword.startsWith('{crypt}')) {
            algorithm = 'crypt';
            const parts: string[] = hashedPassword.split('$');
            if (parts.length < 4 || !parts[1] || !parts[2]) {
                return {
                    ok: false,
                    error: new KeycloakClientError('Invalid crypt hash format'),
                };
            }
            hashIterations = undefined;
            passwordValue = hashedPassword.substring(hashedPassword.indexOf('$'));
        } else {
            return {
                ok: false,
                error: new KeycloakClientError('Unsupported password algorithm'),
            };
        }

        // Check for existing user
        const filter: FindUserFilter = {
            username: user.username,
        };

        if (user.email) {
            filter.email = user.email;
        }

        const findResult: Result<User<true>, DomainError> = await this.findOne(filter);

        if (findResult.ok) {
            return {
                ok: false,
                error: new KeycloakClientError('Username or email already exists'),
            };
        }

        //credentialData & secretData are stringified, otherwiese KC wont accept it
        try {
            const userRepresentation: UserRepresentation = {
                username: user.username,
                enabled: true,
                credentials: [
                    {
                        credentialData: JSON.stringify({
                            hashIterations: hashIterations,
                            algorithm: algorithm,
                        }),
                        secretData: JSON.stringify({
                            value: passwordValue,
                        }),
                        type: 'password',
                    },
                ],
                attributes: user.externalSystemIDs,
            };

            const response: { id: string } = await kcAdminClientResult.value.users.create(userRepresentation);

            return { ok: true, value: response.id };
        } catch (err) {
            this.logger.error(`Could not create user, message: ${JSON.stringify(err)} `);
            return { ok: false, error: new KeycloakClientError('Could not create user') };
        }
    }

    public async delete(id: string): Promise<Result<void, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        return this.wrapClientResponse(kcAdminClientResult.value.users.del({ id }));
    }

    public async findById(id: string): Promise<Result<User<true>, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        const userResult: Result<Option<UserRepresentation>, DomainError> = await this.wrapClientResponse(
            kcAdminClientResult.value.users.findOne({ id }),
        );
        if (!userResult.ok) {
            return userResult;
        }
        if (userResult.value) {
            return this.mapResponseToDto(userResult.value);
        }

        return {
            ok: false,
            error: new EntityNotFoundError(`Keycloak User with the following ID ${id} does not exist`),
        };
    }

    public async findOne(filter: FindUserFilter): Promise<Result<User<true>, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        const userResult: Result<UserRepresentation[], DomainError> = await this.wrapClientResponse(
            kcAdminClientResult.value.users.find({ ...filter, exact: true }),
        );
        if (!userResult.ok) {
            return userResult;
        }

        if (userResult.value.length === 1) {
            return this.mapResponseToDto(userResult.value[0]);
        }

        return {
            ok: false,
            error: new EntityNotFoundError(`Keycloak User could not be found`),
        };
    }

    public async setPassword(
        userId: string,
        password: string,
        temporary: boolean = true,
    ): Promise<Result<string, DomainError>> {
        try {
            // Get authed client
            const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
                await this.kcAdminService.getAuthedKcAdminClient();
            if (!kcAdminClientResult.ok) {
                return kcAdminClientResult;
            }
            await kcAdminClientResult.value.users.resetPassword({
                id: userId,
                credential: {
                    temporary: temporary,
                    type: 'password',
                    value: password,
                },
            });
            return { ok: true, value: password };
        } catch (err) {
            return { ok: false, error: new KeycloakClientError('Could not authorize with Keycloak') };
        }
    }

    private async wrapClientResponse<T>(promise: Promise<T>): Promise<Result<T, DomainError>> {
        try {
            const result: T = await promise;
            return { ok: true, value: result };
        } catch (err) {
            return { ok: false, error: new KeycloakClientError('Keycloak request failed', [err]) };
        }
    }

    private async mapResponseToDto(user?: UserRepresentation): Promise<Result<User<true>, DomainError>> {
        const userReprDto: UserRepresentationDto = plainToClass(UserRepresentationDto, user);
        const validationErrors: ValidationError[] = await validate(userReprDto);

        if (validationErrors.length > 0) {
            return { ok: false, error: new KeycloakClientError('Response is invalid') };
        }

        const userDo: User<true> = User.construct<true>(
            userReprDto.id,
            userReprDto.username,
            userReprDto.email,
            new Date(userReprDto.createdTimestamp),
            {}, // UserAttributes
        );

        return { ok: true, value: userDo };
    }

    public async assignRealmGroupsToUser(
        usernameId: string,
        groupNames: (string | undefined)[],
    ): Promise<Result<void, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }
        const userResult: Result<User<true>, DomainError> = await this.findById(usernameId);
        if (!userResult.ok) {
            return userResult;
        }

        const userId: string = userResult.value.id;

        try {
            const allGroups: GroupRepresentation[] = await kcAdminClientResult.value.groups.find();
            const filteredGroupNames: string[] = groupNames.filter(
                (groupName: string | undefined): groupName is string => groupName !== undefined,
            );

            const groupsToAssign: GroupRepresentation[] = allGroups.filter((group: GroupRepresentation) =>
                filteredGroupNames.some((groupName: string) => group.name === groupName),
            );

            const validGroups: GroupRepresentation[] = groupsToAssign.filter(
                (group: GroupRepresentation | undefined): group is GroupRepresentation =>
                    group !== undefined && group.id !== undefined && group.name !== undefined,
            );

            if (validGroups.length === 0) {
                return {
                    ok: false,
                    error: new EntityNotFoundError(`No valid groups found for the provided group names`),
                };
            }

            const userCurrentGroups: GroupRepresentation[] = await kcAdminClientResult.value.users.listGroups({
                id: userId,
            });

            const newGroupsToAssign: GroupRepresentation[] = validGroups.filter(
                (group: GroupRepresentation) =>
                    !userCurrentGroups.some((userGroup: GroupRepresentation) => userGroup.id === group.id),
            );

            if (newGroupsToAssign.length === 0) {
                return { ok: true, value: undefined };
            }

            for (const group of newGroupsToAssign) {
                await kcAdminClientResult.value.users.addToGroup({
                    id: userId,
                    groupId: group.id!,
                });
            }

            return { ok: true, value: undefined };
        } catch (err) {
            this.logger.error(`Failed to assign groups to user ${usernameId}: ${JSON.stringify(err)}`);
            return { ok: false, error: new KeycloakClientError('Failed to assign groups') };
        }
    }

    public async removeRealmGroupsFromUser(
        usernameId: string,
        groupNames: (string | undefined)[],
    ): Promise<Result<void, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        const userResult: Result<User<true>, DomainError> = await this.findById(usernameId);
        if (!userResult.ok) {
            return userResult;
        }

        const userId: string = userResult.value.id;
        try {
            const allGroups: GroupRepresentation[] = await kcAdminClientResult.value.groups.find();
            const filteredGroupNames: string[] = groupNames.filter(
                (groupName: string | undefined): groupName is string => groupName !== undefined,
            );

            const groupsToRemove: GroupRepresentation[] = allGroups.filter((group: GroupRepresentation) =>
                filteredGroupNames.some((groupName: string) => group.name === groupName),
            );

            const validGroups: GroupRepresentation[] = groupsToRemove.filter(
                (group: GroupRepresentation | undefined): group is GroupRepresentation =>
                    group !== undefined && group.id !== undefined && group.name !== undefined,
            );

            if (validGroups.length === 0) {
                return {
                    ok: false,
                    error: new EntityNotFoundError(`No valid groups found for the provided group names`),
                };
            }

            const userCurrentGroups: GroupRepresentation[] = await kcAdminClientResult.value.users.listGroups({
                id: userId,
            });

            const groupsToUnassign: GroupRepresentation[] = validGroups.filter((group: GroupRepresentation) =>
                userCurrentGroups.some((userGroup: GroupRepresentation) => userGroup.id === group.id),
            );

            if (groupsToUnassign.length === 0) {
                return { ok: true, value: undefined };
            }

            for (const group of groupsToUnassign) {
                await kcAdminClientResult.value.users.delFromGroup({
                    id: userId,
                    groupId: group.id!,
                });
            }

            return { ok: true, value: undefined };
        } catch (err) {
            this.logger.error(`Failed to remove groups from user ${usernameId}: ${JSON.stringify(err)}`);
            return { ok: false, error: new KeycloakClientError('Failed to remove groups') };
        }
    }
}
