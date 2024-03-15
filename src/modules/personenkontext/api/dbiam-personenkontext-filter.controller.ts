import { Body, Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { FindPersonenkontextRollenBodyParams } from './find-personenkontext-rollen.body.params.js';
import { FindPersonenkontextSchulstrukturknotenBodyParams } from './find-personenkontext-schulstrukturknoten.body.params.js';
import { FindRollenResponse } from './find-rollen.response.js';
import { FindSchulstrukturknotenResponse } from './find-schulstrukturknoten.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personenkontext')
@ApiBearerAuth()
@Controller({ path: 'personenkontext' })
export class DbiamPersonenkontextFilterController {
    public constructor(private readonly personenkontextUc: PersonenkontextUc) {}

    @Get('rollen')
    @ApiOkResponse({
        description: 'The rollen for a personenkontexte were successfully returned.',
        type: FindRollenResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available rolen for personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get rollen for personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting rollen for personenkontexte.' })
    public async findRollen(@Body() params: FindPersonenkontextRollenBodyParams): Promise<FindRollenResponse> {
        return this.personenkontextUc.findRollen(params);
    }

    @Get('schulstrukturknoten')
    @ApiOkResponse({
        description: 'The schulstrukturknoten for a personenkontexte were successfully returned.',
        type: FindSchulstrukturknotenResponse,
    })
    @ApiUnauthorizedResponse({
        description: 'Not authorized to get available schulstrukturknoten for personenkontexte.',
    })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get schulstrukturknoten for personenkontext.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting schulstrukturknoten for personenkontexte.',
    })
    public async findSchulstrukturknoten(
        @Body() params: FindPersonenkontextSchulstrukturknotenBodyParams,
    ): Promise<FindSchulstrukturknotenResponse> {
        return this.personenkontextUc.findSchulstrukturknoten(params);
    }
}
