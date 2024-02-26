import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntityAlreadyExistsError } from '../../../shared/error/entity-already-exists.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamCreatePersonenkontextBodyParams } from './dbiam-create-personenkontext.body.params.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './dbiam-find-personenkontext-by-personid.params.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('dbiam-personenkontexte')
@ApiBearerAuth()
@Controller({ path: 'dbiam/personenkontext' })
export class DBiamPersonenkontextController {
    public constructor(private readonly repo: DBiamPersonenkontextRepo) {}

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
    ): Promise<DBiamPersonenkontextResponse[]> {
        const personenkontexte: Personenkontext<true>[] = await this.repo.findByPerson(params.personId);

        const response: DBiamPersonenkontextResponse[] = personenkontexte.map(
            (k: Personenkontext<true>) => new DBiamPersonenkontextResponse(k),
        );

        return response;
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Test',
        type: DBiamPersonenkontextResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to create personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating personenkontext.' })
    public async createPersonenkontext(
        @Body() params: DBiamCreatePersonenkontextBodyParams,
    ): Promise<DBiamPersonenkontextResponse> {
        const exists: boolean = await this.repo.exists(params.personId, params.organisationId, params.rolleId);

        if (exists) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityAlreadyExistsError('Personenkontext already exists'),
                ),
            );
        }

        const newPersonenkontext: Personenkontext<false> = Personenkontext.createNew(
            params.personId,
            params.organisationId,
            params.rolleId,
        );

        const savedPersonenkontext: Personenkontext<true> = await this.repo.save(newPersonenkontext);

        return new DBiamPersonenkontextResponse(savedPersonenkontext);
    }
}
