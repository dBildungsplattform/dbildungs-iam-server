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
import { DomainError, EntityAlreadyExistsError } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamCreatePersonenkontextBodyParams } from './dbiam-create-personenkontext.body.params.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './dbiam-find-personenkontext-by-personid.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';
import { DBiamPersonenkontextService } from '../domain/dbiam-personenkontext.service.js';
import { DbiamPersonenkontextError } from './dbiam-personenkontext.error.js';
import { PersonenkontextExceptionFilter } from './personenkontext-exception-filter.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error.js';

@UseFilters(new SchulConnexValidationErrorFilter(), new PersonenkontextExceptionFilter())
@ApiTags('dbiam-personenkontexte')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'dbiam/personenkontext' })
export class DBiamPersonenkontextController {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly dbiamPersonenkontextService: DBiamPersonenkontextService,
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
    ): Promise<DBiamPersonenkontextResponse[]> {
        const personenkontexte: Personenkontext<true>[] = await this.personenkontextRepo.findByPerson(params.personId);

        return personenkontexte.map((k: Personenkontext<true>) => new DBiamPersonenkontextResponse(k));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Test',
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
        @Body() params: DBiamCreatePersonenkontextBodyParams,
    ): Promise<DBiamPersonenkontextResponse> {
        // Check if personenkontext already exists
        const exists: boolean = await this.personenkontextRepo.exists(
            params.personId,
            params.organisationId,
            params.rolleId,
        );

        if (exists) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityAlreadyExistsError('Personenkontext already exists'),
                ),
            );
        }

        // Construct new personenkontext
        const newPersonenkontext: Personenkontext<false> = Personenkontext.createNew(
            params.personId,
            params.organisationId,
            params.rolleId,
        );

        // Check if all references are valid
        const referenceError: Option<DomainError> = await newPersonenkontext.checkReferences(
            this.personRepo,
            this.organisationRepo,
            this.rolleRepo,
        );

        if (referenceError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(referenceError),
            );
        }

        //Check specifications
        const specificationCheckError: Option<PersonenkontextSpecificationError> =
            await this.dbiamPersonenkontextService.checkSpecifications(newPersonenkontext);
        if (specificationCheckError) {
            throw specificationCheckError;
        }

        // Save personenkontext
        const savedPersonenkontext: Personenkontext<true> = await this.personenkontextRepo.save(newPersonenkontext);

        return new DBiamPersonenkontextResponse(savedPersonenkontext);
    }
}
