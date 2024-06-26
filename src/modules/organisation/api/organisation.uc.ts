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
import { OrganisationResponseLegacy } from './organisation.response.legacy.js';
import { UpdateOrganisationDto } from './update-organisation.dto.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';
import { ServerConfig, DataConfig } from '../../../shared/config/index.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';

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
    ): Promise<CreatedOrganisationDto | SchulConnexError | OrganisationSpecificationError> {
        const organisationDo: OrganisationDo<false> = this.mapper.map(
            organisationDto,
            CreateOrganisationDto,
            OrganisationDo,
        );

        organisationDo.administriertVon ??= this.ROOT_ORGANISATION_ID;
        organisationDo.zugehoerigZu ??= this.ROOT_ORGANISATION_ID;

        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.createOrganisation(
            organisationDo,
        );

        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, CreatedOrganisationDto);
        }
        //avoid passing OrganisationSpecificationError to SchulConnexErrorMapper
        if (result.error instanceof OrganisationSpecificationError) {
            return result.error;
        }

        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async updateOrganisation(
        organisationDto: UpdateOrganisationDto,
    ): Promise<UpdatedOrganisationDto | SchulConnexError | OrganisationSpecificationError> {
        const organisationDo: OrganisationDo<true> = this.mapper.map(
            organisationDto,
            UpdateOrganisationDto,
            OrganisationDo,
        );
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.updateOrganisation(
            organisationDo,
        );

        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, UpdatedOrganisationDto);
        }
        //avoid passing OrganisationSpecificationError to SchulConnexErrorMapper
        if (result.error instanceof OrganisationSpecificationError) {
            return result.error;
        }
        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async findOrganisationById(id: string): Promise<OrganisationResponseLegacy | SchulConnexError> {
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.findOrganisationById(
            id,
        );
        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, OrganisationResponseLegacy);
        }
        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async findRootOrganisation(): Promise<OrganisationResponseLegacy | SchulConnexError> {
        const result: Result<OrganisationDo<true>, DomainError> = await this.organisationService.findOrganisationById(
            this.ROOT_ORGANISATION_ID,
        );

        if (result.ok) {
            return this.mapper.map(result.value, OrganisationDo, OrganisationResponseLegacy);
        }

        return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
    }

    public async findAll(organisationDto: FindOrganisationDto): Promise<Paged<OrganisationResponseLegacy>> {
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

        const organisations: OrganisationResponseLegacy[] = this.mapper.mapArray(
            result.items,
            OrganisationDo,
            OrganisationResponseLegacy,
        );

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: organisations,
        };
    }

    public async setAdministriertVon(
        parentOrganisationId: string,
        childOrganisationId: string,
    ): Promise<void | SchulConnexError | OrganisationSpecificationError> {
        const res: Result<void, OrganisationSpecificationError | DomainError> =
            await this.organisationService.setAdministriertVon(parentOrganisationId, childOrganisationId);

        if (!res.ok) {
            //avoid passing OrganisationSpecificationError to SchulConnexErrorMapper
            if (res.error instanceof OrganisationSpecificationError) {
                return res.error;
            }
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(res.error);
        }
    }

    public async setZugehoerigZu(
        parentOrganisationId: string,
        childOrganisationId: string,
    ): Promise<void | SchulConnexError | OrganisationSpecificationError> {
        const res: Result<void, DomainError> = await this.organisationService.setZugehoerigZu(
            parentOrganisationId,
            childOrganisationId,
        );

        if (!res.ok) {
            //avoid passing OrganisationSpecificationError to SchulConnexErrorMapper
            if (res.error instanceof OrganisationSpecificationError) {
                return res.error;
            }
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(res.error);
        }
    }

    public async findAdministriertVon(
        parentOrganisationId: string,
        searchFilter?: string,
    ): Promise<Paged<OrganisationResponseLegacy> | SchulConnexError> {
        const parentOrg: Result<
            OrganisationDo<true>,
            DomainError
        > = await this.organisationService.findOrganisationById(parentOrganisationId);
        if (!parentOrg.ok) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(parentOrg.error);
        }

        const result: Paged<OrganisationDo<true>> = await this.organisationService.findAllAdministriertVon(
            parentOrganisationId,
            searchFilter,
        );

        const organisations: OrganisationResponseLegacy[] = this.mapper.mapArray(
            result.items,
            OrganisationDo,
            OrganisationResponseLegacy,
        );

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: organisations,
        };
    }

    public async findZugehoerigZu(
        parentOrganisationId: string,
    ): Promise<Paged<OrganisationResponseLegacy> | SchulConnexError> {
        const parentOrg: Result<
            OrganisationDo<true>,
            DomainError
        > = await this.organisationService.findOrganisationById(parentOrganisationId);
        if (!parentOrg.ok) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(parentOrg.error);
        }

        const result: Paged<OrganisationDo<true>> =
            await this.organisationService.findAllZugehoerigZu(parentOrganisationId);

        const organisations: OrganisationResponseLegacy[] = this.mapper.mapArray(
            result.items,
            OrganisationDo,
            OrganisationResponseLegacy,
        );

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: organisations,
        };
    }
}
