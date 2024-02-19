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
import { SchuleAdministriertVonTraeger } from '../specification/schule-administriert-von-traeger.js';
import { TraegerAdministriertVonTraeger } from '../specification/traeger-administriert-von-traeger.js';
import { SchuleZuTraegerError } from '../specification/error/schule-zu-traeger.error.js';
import { TraegerZuTraegerError } from '../specification/error/traeger-zu-traeger.error.js';
import { RootOrganisationImmutableError } from '../specification/error/root-organisation-immutable.error.js';
import { ZyklusInZugehoerigZu } from '../specification/zyklus-in-zugehoerig-zu.js';
import { ZyklusInAdministriertVon } from '../specification/zyklus-in-administriert-von.js';
import { CircularReferenceError } from '../specification/error/circular-reference.error.js';
import { SchuleZugehoerigZuTraeger } from '../specification/schule-zugehoerig-zu-traeger.js';
import { TraegerZugehoerigZuTraeger } from '../specification/traeger-zugehoerig-zu-traeger.js';

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
        // MUST be called before administriertVon is altered
        const validationResult: Result<boolean, DomainError> = await this.validateAdministriertVon(
            childOrganisation,
            parentId,
        );

        if (!validationResult.ok) {
            return { ok: false, error: validationResult.error };
        }
        childOrganisation.administriertVon = parentId;

        try {
            await this.organisationRepo.save(childOrganisation);
            return { ok: true, value: undefined };
        } catch (e) {
            return { ok: false, error: new EntityCouldNotBeUpdated('Organisation', childId) };
        }
    }

    private async validateAdministriertVon(
        childOrganisation: OrganisationDo<true>,
        parentId: string,
    ): Promise<Result<boolean, DomainError>> {
        //check version from DB before administriertVon is altered
        if (!childOrganisation.administriertVon) return { ok: false, error: new RootOrganisationImmutableError() };
        childOrganisation.administriertVon = parentId;

        return this.validateSpecifications(childOrganisation);
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

        // MUST be called before zugehoerigZu is altered
        const validationResult: Result<boolean, DomainError> = await this.validateZugehoerigZu(
            childOrganisation,
            parentId,
        );
        if (!validationResult.ok) {
            return { ok: false, error: validationResult.error };
        }

        childOrganisation.zugehoerigZu = parentId;

        try {
            await this.organisationRepo.save(childOrganisation);
            return { ok: true, value: undefined };
        } catch (e) {
            return { ok: false, error: new EntityCouldNotBeUpdated('Organisation', childId) };
        }
    }

    private async validateZugehoerigZu(
        childOrganisation: OrganisationDo<true>,
        parentId: string,
    ): Promise<Result<boolean, DomainError>> {
        //check version from DB before zugehoerigZu is altered
        if (!childOrganisation.zugehoerigZu) return { ok: false, error: new RootOrganisationImmutableError() };
        childOrganisation.zugehoerigZu = parentId;

        return this.validateSpecifications(childOrganisation);
    }

    private async validateSpecifications(
        childOrganisation: OrganisationDo<true>,
    ): Promise<Result<boolean, DomainError>> {
        const schuleAdministriertVonTraeger: SchuleAdministriertVonTraeger = new SchuleAdministriertVonTraeger(
            this.organisationRepo,
        );
        if (!(await schuleAdministriertVonTraeger.isSatisfiedBy(childOrganisation))) {
            return {
                ok: false,
                error: new SchuleZuTraegerError(childOrganisation.id, 'SchuleAdministriertVonTraeger'),
            };
        }
        const schuleZugehoerigZuTraeger: SchuleZugehoerigZuTraeger = new SchuleZugehoerigZuTraeger(
            this.organisationRepo,
        );
        if (!(await schuleZugehoerigZuTraeger.isSatisfiedBy(childOrganisation))) {
            return { ok: false, error: new SchuleZuTraegerError(childOrganisation.id, 'SchuleZugehoerigZuTraeger') };
        }
        const traegerAdministriertVonTraeger: TraegerAdministriertVonTraeger = new TraegerAdministriertVonTraeger(
            this.organisationRepo,
        );
        if (!(await traegerAdministriertVonTraeger.isSatisfiedBy(childOrganisation))) {
            return {
                ok: false,
                error: new TraegerZuTraegerError(childOrganisation.id, 'TraegerAdministriertVonTraeger'),
            };
        }
        const traegerZugehoerigZuTraeger: TraegerZugehoerigZuTraeger = new TraegerZugehoerigZuTraeger(
            this.organisationRepo,
        );
        if (!(await traegerZugehoerigZuTraeger.isSatisfiedBy(childOrganisation))) {
            return { ok: false, error: new TraegerZuTraegerError(childOrganisation.id, 'TraegerZugehoerigZuTraeger') };
        }
        const zyklusInAdministriertVon: ZyklusInAdministriertVon = new ZyklusInAdministriertVon(this.organisationRepo);
        if (await zyklusInAdministriertVon.isSatisfiedBy(childOrganisation)) {
            return { ok: false, error: new CircularReferenceError(childOrganisation.id, 'ZyklusInAdministriertVon') };
        }
        const zyklusInZugehoerigZu: ZyklusInZugehoerigZu = new ZyklusInZugehoerigZu(this.organisationRepo);
        if (await zyklusInZugehoerigZu.isSatisfiedBy(childOrganisation)) {
            return { ok: false, error: new CircularReferenceError(childOrganisation.id, 'ZyklusInZugehoerigZu') };
        }
        return { ok: true, value: true };
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
