import { Injectable } from '@nestjs/common';
import { OrganisationRepo } from '../persistence/organisation.repo.js';
import {
    DomainError,
    EntityCouldNotBeCreated,
    EntityCouldNotBeUpdated,
    EntityNotFoundError,
} from '../../../shared/error/index.js';
import { OrganisationDo } from './organisation.do.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationScope } from '../persistence/organisation.scope.js';
import { SchuleZuTraeger } from '../specification/schule-zu-traeger.js';
import { TraegerZuTraeger } from '../specification/traeger-zu-traeger.js';
import { SchuleZuTraegerError } from '../specification/error/schule-zu-traeger.error.js';
import { TraegerZuTraegerError } from '../specification/error/traeger-zu-traeger.error.js';
import { AdministriertZyklus } from '../specification/administriert-zyklus.js';
import { AdministriertZyklusError } from '../specification/error/administriert-zyklus.error.js';

@Injectable()
export class OrganisationService {
    public constructor(private readonly organisationRepo: OrganisationRepo) {}

    public async createOrganisation(
        organisationDo: OrganisationDo<false>,
    ): Promise<Result<OrganisationDo<true>, DomainError>> {
        if (organisationDo.administriertVon && !(await this.organisationRepo.exists(organisationDo.administriertVon))) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', organisationDo.administriertVon),
            };
        }

        if (organisationDo.zugehoerigZu && !(await this.organisationRepo.exists(organisationDo.zugehoerigZu))) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', organisationDo.zugehoerigZu),
            };
        }

        const organisation: OrganisationDo<true> = await this.organisationRepo.save(organisationDo);
        if (organisation) {
            return { ok: true, value: organisation };
        }
        return { ok: false, error: new EntityCouldNotBeCreated(`Organization could not be created`) };
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

    public async setAdministriertVon(parentId: string, childId: string): Promise<Result<void, DomainError>> {
        const parentExists: boolean = await this.organisationRepo.exists(parentId);
        if (!parentExists) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', parentId),
            };
        }

        const childOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(childId);
        if (!childOrganisation) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            };
        }

        childOrganisation.administriertVon = parentId;
        const validationResult: Result<boolean, DomainError> = await this.validateAdministriertVon(childOrganisation);
        if (!validationResult.ok) {
            return { ok: false, error: validationResult.error };
        }

        const organisation: OrganisationDo<true> = await this.organisationRepo.save(childOrganisation);
        if (organisation) {
            return { ok: true, value: undefined };
        }

        return { ok: false, error: new EntityCouldNotBeUpdated('Organisation', childId) };
    }

    private async validateAdministriertVon(
        childOrganisation: OrganisationDo<true>,
    ): Promise<Result<boolean, DomainError>> {
        const schuleAdministriertVonTraeger: SchuleZuTraeger = new SchuleZuTraeger(this.organisationRepo);
        if (!(await schuleAdministriertVonTraeger.isSatisfiedBy(childOrganisation))) {
            return { ok: false, error: new SchuleZuTraegerError(childOrganisation.id, 'SchuleZuTraeger') };
        }
        const traegerAdministriertVonTraeger: TraegerZuTraeger = new TraegerZuTraeger(this.organisationRepo);
        if (!(await traegerAdministriertVonTraeger.isSatisfiedBy(childOrganisation))) {
            return { ok: false, error: new TraegerZuTraegerError(childOrganisation.id, 'TraegerZuTraeger') };
        }
        const administriertZyklus: AdministriertZyklus = new AdministriertZyklus(this.organisationRepo);
        if (await administriertZyklus.isSatisfiedBy(childOrganisation)) {
            return { ok: false, error: new AdministriertZyklusError(childOrganisation.id, 'ZyklusInAdministiertVon') };
        }
        return { ok: true, value: true };
    }

    public async setZugehoerigZu(parentId: string, childId: string): Promise<Result<void, DomainError>> {
        const parentExists: boolean = await this.organisationRepo.exists(parentId);
        if (!parentExists) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', parentId),
            };
        }

        const childOrganisation: Option<OrganisationDo<true>> = await this.organisationRepo.findById(childId);
        if (!childOrganisation) {
            return {
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            };
        }

        childOrganisation.zugehoerigZu = parentId;

        const organisation: OrganisationDo<true> = await this.organisationRepo.save(childOrganisation);
        if (organisation) {
            return { ok: true, value: undefined };
        }

        return { ok: false, error: new EntityCouldNotBeUpdated('Organisation', childId) };
    }

    public async findAllAdministriertVon(
        parentOrganisationID: string,
        offset?: number,
        limit?: number,
    ): Promise<Paged<OrganisationDo<true>>> {
        const scope: OrganisationScope = new OrganisationScope()
            .findAdministrierteVon(parentOrganisationID)
            .paged(offset, limit);

        const [organisations, total]: Counted<OrganisationDo<true>> = await this.organisationRepo.findBy(scope);

        return {
            total,
            offset: offset ?? 0,
            limit: limit ?? total,
            items: organisations,
        };
    }

    public async findAllZugehoerigZu(
        parentOrganisationID: string,
        offset?: number,
        limit?: number,
    ): Promise<Paged<OrganisationDo<true>>> {
        const scope: OrganisationScope = new OrganisationScope()
            .findZugehoerigeZu(parentOrganisationID)
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
