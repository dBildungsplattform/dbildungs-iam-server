import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';

@Injectable()
export class OrganisationUc {
    public constructor(
        private readonly organisationService: OrganisationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createOrganisation(
        organisationDto: CreateOrganisationDto,
    ): Promise<CreatedOrganisationDto | SchulConnexError> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.createOrganisation(
            organisationDo,
        );

        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, CreatedOrganisationDto);
        }

        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async findOrganisationById(id: string): Promise<OrganisationResponse | SchulConnexError> {
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.findOrganisationById(
            id,
        );
        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, OrganisationResponse);
        }
        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async findAll(organisationDto: FindOrganisationDto): Promise<Paged<OrganisationResponse>> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            FindOrganisationDto,
            OrganisationDo,
        );
        const result: Paged<OrganisationDo<true>> = await this.organisationService.findAllOrganizations(
            organisationDo,
            organisationDto.offset,
            organisationDto.limit,
        );

        if (result.total === 0) {
            return {
                total: result.total,
                offset: result.offset,
                limit: result.limit,
                items: [],
            };
        }

        const organisations: OrganisationResponse[] = this.mapper.mapArray(
            result.items,
            OrganisationDo,
            OrganisationResponse,
        );

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: organisations,
        };
    }
}
