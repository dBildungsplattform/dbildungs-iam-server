import { Controller, UseFilters, Post } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('gruppen')
@ApiBearerAuth()
@Controller({ path: 'gruppen' })
export class GruppenController {
    // public constructor() {
    //     // TODO
    //     // private GruppenRepository: GruppenRepository
    //     // priavte GruppenFactory: GruppenFactory
    // } {}

    @Post()
    @ApiCreatedResponse({ description: 'The organisation was successfully created.' })
    @ApiBadRequestResponse({ description: 'The organisation already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the organisation.' })
    // add body params here CreateGroupBodyParams.
    public async createGroup(): Promise<void> {
        // TODO
    }
}
