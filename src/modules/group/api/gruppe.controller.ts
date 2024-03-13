import { Controller, UseFilters, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
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
import { DomainError } from '../../../shared/error/domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';

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
    @ApiCreatedResponse({ description: 'The group was successfully created.' })
    @ApiBadRequestResponse({ description: 'The group already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the group.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the group.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the group.' })
    public async createGroup(@Body() params: CreateGroupBodyParams): Promise<Gruppe<true> | HttpException> {
        const gruppe: Gruppe<false> = this.gruppenFactory.createGroup(params);
        const result: Result<Gruppe<true>, DomainError> = await this.gruppenRepository.save(gruppe);
        if (!result.ok) {
            return SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        return result.value;
    }
}
