import { Body, Controller, Get, UseFilters } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { PersonenkontextUc } from '../api/personenkontext.uc.js';
import { FindPersonenkontextRollenBodyParams } from '../api/find-personenkontext-rollen.body.params.js';
import { FindPersonenkontextSchulstrukturknotenBodyParams } from '../api/find-personenkontext-schulstrukturknoten.body.params.js';
import { FindRollenResponse } from '../api/find-rollen.response.js';
import { FindSchulstrukturknotenResponse } from '../api/find-schulstrukturknoten.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personenkontext')
@ApiBearerAuth()
@Controller({ path: 'personenkontext' })
export class DBiamPersonenkontextController {
    public constructor(private readonly personenkontextUc: PersonenkontextUc) {}

    @Get('rollen')
    public async findRollen(@Body() params: FindPersonenkontextRollenBodyParams): Promise<FindRollenResponse> {
        return this.personenkontextUc.findRollen(params);
    }

    @Get('schulstrukturknoten')
    public async findSchulstrukturknoten(
        @Body() params: FindPersonenkontextSchulstrukturknotenBodyParams,
    ): Promise<FindSchulstrukturknotenResponse> {
        return this.personenkontextUc.findSchulstrukturknoten(params);
    }
}
