import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Controller, Get, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { FindPersonenkontextByIdDto } from './find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from './find-personenkontext-by-id.params.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextUc } from './personenkontext.uc.js';

@Public()
@ApiTags('personenkontexte')
@Controller({ path: 'personenkontexte' })
export class PersonenkontextController {
    public constructor(
        private readonly personenkontextUc: PersonenkontextUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Get(':personenkontextId')
    @ApiOkResponse({
        description: 'The personenkontext was successfully returned.',
        type: PersonendatensatzResponse,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async findPersonenkontextById(
        @Param() params: FindPersonenkontextByIdParams,
    ): Promise<PersonendatensatzResponse> {
        try {
            const request: FindPersonenkontextByIdDto = this.mapper.map(
                params,
                FindPersonenkontextByIdParams,
                FindPersonenkontextByIdDto,
            );
            const result: PersonendatensatzDto = await this.personenkontextUc.findPersonenkontextById(request);
            const response: PersonendatensatzResponse = this.mapper.map(
                result,
                PersonendatensatzDto,
                PersonendatensatzResponse,
            );

            return response;
        } catch (error: unknown) {
            if (error instanceof EntityNotFoundError) {
                throw new HttpException(error.message, HttpStatus.NOT_FOUND);
            }

            throw error;
        }
    }
}
