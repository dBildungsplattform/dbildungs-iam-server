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
import { PersonID } from '../../shared/types/aggregate-ids.types.js';
import { UserLock } from '../keycloak-administration/domain/user-lock.js';

@Controller({ path: 'cron' })
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiTags('cron')
export class CronController {
    public constructor(
        private readonly keyCloakUserService: KeycloakUserService,
        private readonly personRepository: PersonRepository,
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
            const personIdsTouple: [PersonID, string][] = await this.personRepository.getKoPersUserLockList();

            // Check if the array is empty (personIdsTouple === 0 is incorrect for array checks)
            if (personIdsTouple.length === 0) {
                return true;
            }

            const results: PromiseSettledResult<Result<void, DomainError>>[] = await Promise.allSettled(
                personIdsTouple.map(([personId, keycloakUserId]: [PersonID, string]) => {
                    const userLock: UserLock = UserLock.construct(personId, 'Cron', new Date(), new Date());
                    return this.keyCloakUserService.updateKeycloakUserStatus(personId, keycloakUserId, false, userLock);
                }),
            );

            // Check if all operations were successful
            const allSuccessful: boolean = results.every(
                (result: PromiseSettledResult<Result<void, DomainError>>) =>
                    result.status === 'fulfilled' && result.value.ok === true,
            );

            return allSuccessful;
        } catch (error) {
            throw new Error('Failed to lock users due to an internal server error.');
        }
    }
}
