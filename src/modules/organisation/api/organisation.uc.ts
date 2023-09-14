import { Inject, Injectable } from '@nestjs/common';
import { OrganisationService } from '../domain/organisation.service.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationDo } from '../domain/organisation.do.js';

@Injectable()
export class OrganisationUc {
    public constructor(
        private readonly organisationService: OrganisationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createOrganisation(organisationDto: CreateOrganisationDto): Promise<void> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );
        const result: Result<OrganisationDo<true>> = await this.organisationService.createOrganisation(organisationDo);
        if (result.ok) {
            return;
        }
        throw result.error;
    }
}
