import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { ServerConfig, DataConfig } from '../../../shared/config/index.js';

@Injectable()
export class OrganisationUc {
    private readonly ROOT_ORGANISATION_ID: string;

    public constructor(
        private readonly organisationService: OrganisationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
        config: ConfigService<ServerConfig>,
    ) {
        this.ROOT_ORGANISATION_ID = config.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;
    }

    public async createOrganisation(
        organisationDto: CreateOrganisationDto,
    ): Promise<CreatedOrganisationDto | SchulConnexError> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );

        organisationDo.verwaltetVon ??= this.ROOT_ORGANISATION_ID;
        organisationDo.zugehoerigZu ??= this.ROOT_ORGANISATION_ID;

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

    public async findRootOrganisation(): Promise<OrganisationResponse | SchulConnexError> {
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.findOrganisationById(
            this.ROOT_ORGANISATION_ID,
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

    public async setVerwaltetVon(parentOrganisationId: string, childOrganisationId: string): Promise<void> {
        const res: Result<void> = await this.organisationService.setVerwaltetVon(
            parentOrganisationId,
            childOrganisationId,
        );

        if (!res.ok) {
            throw res.error;
        }
    }

    public async setZugehoerigZu(parentOrganisationId: string, childOrganisationId: string): Promise<void> {
        const res: Result<void> = await this.organisationService.setZugehoerigZu(
            parentOrganisationId,
            childOrganisationId,
        );

        if (!res.ok) {
            throw res.error;
        }
    }

    public async findVerwaltetVon(parentOrganisationId: string): Promise<Paged<OrganisationResponse>> {
        const parentOrg: Result<OrganisationDo<true>> =
            await this.organisationService.findOrganisationById(parentOrganisationId);
        if (!parentOrg.ok) {
            throw parentOrg.error;
        }

        const result: Paged<OrganisationDo<true>> =
            await this.organisationService.findAllVerwaltetVon(parentOrganisationId);

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

    public async findZugehoerigZu(parentOrganisationId: string): Promise<Paged<OrganisationResponse>> {
        const parentOrg: Result<OrganisationDo<true>> =
            await this.organisationService.findOrganisationById(parentOrganisationId);
        if (!parentOrg.ok) {
            throw parentOrg.error;
        }

        const result: Paged<OrganisationDo<true>> =
            await this.organisationService.findAllZugehoerigZu(parentOrganisationId);

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
