import { Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import {
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiInternalServerErrorResponse,
    ApiBearerAuth,
    ApiOAuth2,
    ApiTags,
} from '@nestjs/swagger';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { KeycloakUserService } from '../keycloak-administration/domain/keycloak-user.service.js';
import { DomainError } from '../../shared/error/domain.error.js';
import { PersonDeleteService } from '../person/person-deletion/person-delete.service.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';
import { Permissions } from '../authentication/api/permissions.decorator.js';

@Controller({ path: 'cron' })
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('cron')
export class CronController {
    public constructor(
        private readonly keyCloakUserService: KeycloakUserService,
        private readonly personRepository: PersonRepository,
        private readonly personDeleteService: PersonDeleteService,
    ) {}

    @Put('kopers-lock')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'User were successfully locked.', type: Boolean })
    @ApiBadRequestResponse({ description: 'User are not given or not found' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to lock user.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to lock user.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to lock user.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while trying to lock user.' })
    public async KoPersUserLock(): Promise<boolean> {
        try {
            const keyCloakIds: string[] = await this.personRepository.getKoPersUserLockList();
            if (keyCloakIds.length === 0) {
                return true;
            }

            const results: PromiseSettledResult<Result<void, DomainError>>[] = await Promise.allSettled(
                keyCloakIds.map((id: string) => this.keyCloakUserService.updateKeycloakUserStatus(id, false)),
            );

            const allSuccessful: boolean = results.every(
                (result: PromiseSettledResult<Result<void, DomainError>>) =>
                    result.status === 'fulfilled' && result.value.ok === true,
            );

            return allSuccessful;
        } catch (error) {
            throw new Error('Failed to lock users due to an internal server error.');
        }
    }

    @Put('person-without-org')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'User were successfully removed.', type: Boolean })
    @ApiBadRequestResponse({ description: 'User are not given or not found' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to remove user.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to delete user.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to delete user.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while trying to remove user.' })
    public async PersonWithoutOrgDelete(@Permissions() permissions: PersonPermissions): Promise<boolean> {
        try {
            const personIds: string[] = await this.personRepository.getPersonWithoutOrgDeleteList();
            if (personIds.length === 0) {
                return true;
            }

            const results: PromiseSettledResult<Result<void, DomainError>>[] = await Promise.allSettled(
                personIds.map((id: string) => this.personDeleteService.deletePerson(id, permissions)),
            );

            const allSuccessful: boolean = results.every(
                (result: PromiseSettledResult<Result<void, DomainError>>) =>
                    result.status === 'fulfilled' && result.value.ok === true,
            );

            return allSuccessful;
        } catch (error) {
            throw new Error('Failed to delete users due to an internal server error.');
        }
    }
}
