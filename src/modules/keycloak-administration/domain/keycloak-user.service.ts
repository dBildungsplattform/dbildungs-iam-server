import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { KeycloakAdminClient, type UserRepresentation } from '@s3pweb/keycloak-admin-client-cjs';
import { plainToClass } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';

import { DomainError, EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakAdministrationService } from './keycloak-admin-client.service.js';
import { UserRepresentationDto } from './keycloak-client/user-representation.dto.js';
import { UserDo } from './user.do.js';

@Injectable()
export class KeycloakUserService {
    public constructor(
        private readonly kcAdminService: KeycloakAdministrationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async create(user: UserDo<false>): Promise<Result<string, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        try {
            const response: { id: string } = await kcAdminClientResult.value.users.create({
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                enabled: true,
            });

            return { ok: true, value: response.id };
        } catch (err) {
            return { ok: false, error: new KeycloakClientError('Could not create user') };
        }
    }

    public async findById(id: string): Promise<Result<UserDo<true>, DomainError>> {
        const kcAdminClientResult: Result<KeycloakAdminClient, DomainError> =
            await this.kcAdminService.getAuthedKcAdminClient();

        if (!kcAdminClientResult.ok) {
            return kcAdminClientResult;
        }

        let user: Option<UserRepresentation>;
        try {
            user = await kcAdminClientResult.value.users.findOne({ id });
        } catch (err) {
            return { ok: false, error: new KeycloakClientError('Could not retrieve user') };
        }

        if (user) {
            const userReprDto: UserRepresentationDto = plainToClass(UserRepresentationDto, user);
            const validationErrors: ValidationError[] = await validate(userReprDto);

            if (validationErrors.length > 0) {
                return { ok: false, error: new KeycloakClientError('Keycloak response for findOne is invalid') };
            }

            return { ok: true, value: this.mapper.map(user, UserRepresentationDto, UserDo) };
        }

        return {
            ok: false,
            error: new EntityNotFoundError(`Keycloak User with the following ID ${id} does not exist`),
        };
    }
}
