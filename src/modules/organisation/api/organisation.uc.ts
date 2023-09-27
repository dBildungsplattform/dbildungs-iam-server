import { Inject, Injectable } from '@nestjs/common';
import { OrganisationService } from '../domain/organisation.service.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';

@Injectable()
export class OrganisationUc {
    public constructor(
        private readonly organisationService: OrganisationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createOrganisation(organisationDto: CreateOrganisationDto): Promise<CreatedOrganisationDto> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );
        const result: Result<OrganisationDo<true>> = await this.organisationService.createOrganisation(organisationDo);
        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, CreatedOrganisationDto);
        }
        throw result.error;
    }

    public async findOrganisationById(id: string): Promise<OrganisationResponse> {
        const result: Result<OrganisationDo<true>> = await this.organisationService.findOrganisationById(id);
        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, OrganisationResponse);
        }
        throw result.error;
    }
}
