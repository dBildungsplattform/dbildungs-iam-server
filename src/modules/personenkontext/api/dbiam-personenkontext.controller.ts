import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DomainError, EntityCouldNotBeCreated, EntityNotFoundError } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamPersonenkontextResponse } from './response/dbiam-personenkontext.response.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { DbiamPersonenkontextBodyParams } from './param/dbiam-personenkontext.body.params.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './param/dbiam-find-personenkontext-by-personid.params.js';
import { DbiamPersonenkontextError } from './dbiam-personenkontext.error.js';
import { PersonenkontextExceptionFilter } from './personenkontext-exception-filter.js';
import { PersonenkontexteUpdateExceptionFilter } from './personenkontexte-update-exception-filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { DbiamPersonenkontextFactory } from '../domain/dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdate } from '../domain/personenkontexte-update.js';
import { PermissionsOverride } from '../../../shared/permissions/permissions-override.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

@UseFilters(
    new SchulConnexValidationErrorFilter(),
    new PersonenkontextExceptionFilter(),
    new PersonenkontexteUpdateExceptionFilter(),
    new AuthenticationExceptionFilter(),
)
@ApiTags('dbiam-personenkontexte')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'dbiam/personenkontext' })
export class DBiamPersonenkontextController {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
    ) {}

    @Get(':personId')
    @ApiOkResponse({
        description: 'The personenkontexte were successfully returned.',
        type: [DBiamPersonenkontextResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenkontexte for this user.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenkontexte.' })
    public async findPersonenkontextsByPerson(
        @Param() params: DBiamFindPersonenkontexteByPersonIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<DBiamPersonenkontextResponse[]> {
        const result: Result<Personenkontext<true>[], DomainError> =
            await this.personenkontextRepo.findByPersonAuthorized(params.personId, permissions);

        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        return result.value.map((k: Personenkontext<true>) => new DBiamPersonenkontextResponse(k));
    }

    /**
     * In consultation with Kristoff Kiefer, the person context workflow aggregate is used internally in this Controller (The Controller is just a Wrapper),
     * so that we can save ourselves the duplication of work and have one dedicated workflow for creating kontexts internally.
     * This means that there is more logic than usual in the controller, but the endpoint may only be used by the migration anyway and will therefore be deleted after GoLive
     *
     * @param params
     * @param permissions
     * @returns DBiamPersonenkontextResponse of created Kontext
     */

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Personenkontext was successfully created.',
        type: DBiamPersonenkontextResponse,
    })
    @ApiBadRequestResponse({
        description: 'The personenkontext could not be created, may due to unsatisfied specifications.',
        type: DbiamPersonenkontextError,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to create personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating personenkontext.' })
    public async createPersonenkontext(
        @Body() params: DbiamPersonenkontextBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<DBiamPersonenkontextResponse> {
        const isMigrationUser: boolean = await permissions.hasSystemrechteAtRootOrganisation([
            RollenSystemRecht.MIGRATION_DURCHFUEHREN,
        ] satisfies RollenSystemRecht[]);

        if (!isMigrationUser) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityCouldNotBeCreated('Personkontext')),
            );
        }

        const dbiamPersonenkontextBodyParams: DbiamPersonenkontextBodyParams[] = (
            await this.personenkontextRepo.findByPerson(params.personId)
        ).map((pk: Personenkontext<true>) => ({
            personId: pk.personId,
            organisationId: pk.organisationId,
            rolleId: pk.rolleId,
        }));

        dbiamPersonenkontextBodyParams.push({
            //Dopplungs Check is avoided due to performance (anyways checked by DB-UNIQUE Constraint)
            personId: params.personId,
            organisationId: params.organisationId,
            rolleId: params.rolleId,
        });

        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            params.personId,
            new Date(),
            0,
            dbiamPersonenkontextBodyParams,
            new PermissionsOverride(permissions).grantPersonModifyPermission(params.personId),
        );

        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();

        if (updateResult instanceof PersonenkontexteUpdateError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(updateResult),
            );
        }
        const createdPk: Personenkontext<true> | undefined = updateResult.find(
            (pk: Personenkontext<true>) =>
                pk.personId === params.personId &&
                pk.rolleId === params.rolleId &&
                pk.organisationId === params.organisationId,
        );
        if (!createdPk) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityCouldNotBeCreated('Personkontext')),
            );
        }
        return new DBiamPersonenkontextResponse(createdPk);
    }
}
