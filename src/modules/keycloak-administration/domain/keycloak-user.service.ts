import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { KeycloakAdminClient, type UserRepresentation } from '@s3pweb/keycloak-admin-client-cjs';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { DomainError, EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { UserRepresentationDto } from './keycloak-client/user-representation.dto.js';
import { UserDo } from './user.do.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

export type FindUserFilter = {
    username?: string;
    email?: string;
};

@Injectable()
export class KeycloakUserService {
    public constructor(
        private readonly kcAdminService: KeycloakAdministrationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
        private readonly logger: ClassLogger,
    ) {}

    public async create(user: UserDo<false>, password?: string): Promise<Result<string, DomainError>> {
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

        const findResult: Result<UserDo<true>, DomainError> = await this.findOne(filter);

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

    public async createWithHashedPassword(): Promise<Result<string, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        try {
            const userRepresentation: UserRepresentation = {
                username: 'thisisfixedfortesting1',
                enabled: true,
                credentials: [
                    {
                        credentialData: JSON.stringify({
                            hashIterations: 12,
                            algorithm: 'bcrypt',
                        }),
                        secretData: JSON.stringify({
                            value: '{BCRYPT}$2b$12$P8vBnldUyI3eCJNKyjq3hOfa1zB27lxf69qc.b4QGCI5768l26EzC',
                        }),
                        type: 'password',
                    },
                ],
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

    public async findById(id: string): Promise<Result<UserDo<true>, DomainError>> {
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

    public async findOne(filter: FindUserFilter): Promise<Result<UserDo<true>, DomainError>> {
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

    private async mapResponseToDto(user?: UserRepresentation): Promise<Result<UserDo<true>, DomainError>> {
        const userReprDto: UserRepresentationDto = plainToClass(UserRepresentationDto, user);
        const validationErrors: ValidationError[] = await validate(userReprDto);

        if (validationErrors.length > 0) {
            return { ok: false, error: new KeycloakClientError('Response is invalid') };
        }

        return { ok: true, value: this.mapper.map(userReprDto, UserRepresentationDto, UserDo) };
    }
}
