import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('dbiam-personenuebersicht')
@ApiBearerAuth()
@Controller({ path: 'dbiam/personenuebersicht' })
export class DBiamPersonenuebersichtController {
    public constructor() {}

    @Get('')
    @ApiOkResponse({
        description: 'The personenuebersichten were successfully returned.',
        type: [DBiamPersonenkontextResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenuebersichten.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenuebersichten.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenuebersichten.' })
    public async findPersonenuebersichten(@Param() params: any): Promise<any[]> {}

    @Get(':personId')
    @ApiOkResponse({
        description: 'The personenuebersicht was successfully returned.',
        type: [DBiamPersonenkontextResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenuebersicht.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenuebersicht.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenuebersicht.' })
    public async findPersonenuebersichtenByPerson(@Param() params: any): Promise<any> {}
}
