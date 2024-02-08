import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Controller, Get, Inject, Query, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import {
    ApiOkResponsePaginated,
    DisablePagingInterceptor,
    Paged,
    RawPagedResponse,
} from '../../../shared/paging/index.js';
import { PersonUc } from '../api/person.uc.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personen-frontend')
@ApiBearerAuth()
@Controller({ path: 'personen-frontend' })
export class PersonFrontendController {
    public constructor(
        private readonly personUc: PersonUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Get()
    @DisablePagingInterceptor()
    @ApiOkResponsePaginated(PersonendatensatzResponse, {
        description:
            'The persons were successfully returned. WARNING: This endpoint returns all persons as default when no paging parameters were set.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get persons.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get persons.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all persons.' })
    public async findPersons(
        @Query() queryParams: PersonenQueryParams,
    ): Promise<RawPagedResponse<PersonendatensatzResponse>> {
        const findDto: FindPersonendatensatzDto = this.mapper.map(
            queryParams,
            PersonenQueryParams,
            FindPersonendatensatzDto,
        );
        const pagedDtos: Paged<PersonendatensatzDto> = await this.personUc.findAll(findDto);
        const response: RawPagedResponse<PersonendatensatzResponse> = new RawPagedResponse({
            offset: pagedDtos.offset,
            limit: pagedDtos.limit,
            total: pagedDtos.total,
            items: this.mapper.mapArray(pagedDtos.items, PersonendatensatzDto, PersonendatensatzResponse),
        });

        return response;
    }
}
