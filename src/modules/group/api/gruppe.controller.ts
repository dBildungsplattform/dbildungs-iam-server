import { Controller, UseFilters, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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
import { CreateGroupBodyParams } from './create-group.body.params.js';
import { GruppenFactory } from '../domain/gruppe.factory.js';
import { GruppenRepository } from '../domain/gruppe.repo.js';
import { Gruppe } from '../domain/gruppe.js';
@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('gruppen')
@ApiBearerAuth()
@Controller({ path: 'gruppen' })
export class GruppenController {
    public constructor(
        private readonly gruppenRepository: GruppenRepository,
        private readonly gruppenFactory: GruppenFactory,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'The organisation was successfully created.' })
    @ApiBadRequestResponse({ description: 'The organisation already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the organisation.' })
    public async createGroup(@Body() params: CreateGroupBodyParams): Promise<void> {
        const gruppe: Gruppe = this.gruppenFactory.createGroup(params);
        await this.gruppenRepository.createGruppe(gruppe);
    }
}
