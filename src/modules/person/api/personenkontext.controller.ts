import { Controller, Get, Param } from '@nestjs/common';
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
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonenkontextByIdParams } from './personenkontext-by-id.params.js';

@Public()
@ApiTags('personenkontexte')
@Controller({ path: 'personenkontexte' })
export class PersonenkontextController {
    public constructor(private readonly personenkontextUc: PersonenkontextUc) {}

    @Get(':personenkontextId')
    @ApiOkResponse({ description: 'The personenkontext was successfully returned.' })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async findById(@Param() params: PersonenkontextByIdParams): Promise<unknown> {
        const result: unknown = await this.personenkontextUc.findById(params.personenKontextId);

        return result;
    }
}
