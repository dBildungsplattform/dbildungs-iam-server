import { Injectable } from '@nestjs/common';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import { DomainError, EntityCouldNotBeUpdated, EntityNotFoundError } from '../../../shared/error/index.js';
import { OrganisationDo } from './organisation.do.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationScope } from '../persistence/organisation.scope.js';

@Injectable()
export class OrganisationService {
    public constructor(private readonly organisationRepo: OrganisationRepo) {}

    public async createOrganisation(
        organisationDo: OrganisationDo<false>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        if (organisation) {
            return { ok: true, value: organisation };
        }
        return { ok: false, error: new EntityCouldNotBeCreated(`Organization could not be created`) };
    }

    public async updateOrganisation(
        organisationDo: OrganisationDo<true>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        const storedOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(
            organisationDo.id,
        );
        if (!storedOrganisation) {
            return { ok: false, error: new EntityNotFoundError('Organisation', organisationDo.id) };
        }
        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        if (organisation) {
            return { ok: true, value: organisation };
        }

        return {
            ok: false,
            error: new EntityCouldNotBeUpdated(`Organization could not be updated`, organisationDo.id),
        };
    }

    public async findOrganisationById(id: string): Promise<Result<OrganisationDo<true>, DomainError>> {
        const organisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(id);
        if (organisation) {
            return { ok: true, value: organisation };
        }
        return { ok: false, error: new EntityNotFoundError('Organization', id) };
    }

    public async findAllOrganizations(
        organisationDo: Partial<OrganisationDo<false>>,
        offset?: number,
        limit?: number,
    ): Promise<Paged<OrganisationDo<true>>> {
        const scope: OrganisationScope = new OrganisationScope()
            .findBy({
                kennung: organisationDo.kennung,
                name: organisationDo.name,
                typ: organisationDo.typ,
            })
            .paged(offset, limit);
        const [organisations, total]: Counted<OrganisationDo<true>> = await this.organisationRepo.findBy(scope);

        return {
            total,
            offset: offset ?? 0,
            limit: limit ?? total,
            items: organisations,
        };
    }
}
