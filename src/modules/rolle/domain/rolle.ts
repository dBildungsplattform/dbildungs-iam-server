import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityAlreadyExistsError, EntityNotFoundError } from '../../../shared/error/index.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { NameValidator } from '../../../shared/validation/name-validator.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { NameForRolleWithTrailingSpaceError } from './name-with-trailing-space.error.js';
import { RollenArt, RollenMerkmal } from './rolle.enums.js';
import { OrganisationMatchesRollenartError } from './specification/error/organisation-matches-rollenart.error.js';
import { OrganisationMatchesRollenart } from './specification/organisation-matches-rollenart.js';
import { RollenSystemRecht } from './systemrecht.js';

export class Rolle<WasPersisted extends boolean> {
    private constructor(
        public organisationRepo: OrganisationRepository,
        public serviceProviderRepo: ServiceProviderRepo,
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public version: Persisted<number, WasPersisted>,
        public name: string,
        public administeredBySchulstrukturknoten: string,
        public rollenart: RollenArt,
        public merkmale: RollenMerkmal[],
        public systemrechte: RollenSystemRecht[],
        public serviceProviderIds: string[],
        public istTechnisch: boolean,
        public serviceProviderData: ServiceProvider<true>[],
    ) {}

    public static createNew(
        organisationRepo: OrganisationRepository,
        serviceProviderRepo: ServiceProviderRepo,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
        serviceProviderData: ServiceProvider<true>[],
        istTechnisch: boolean,
    ): Rolle<false> | DomainError {
        // Validate the Rollenname
        if (!NameValidator.isNameValid(name)) {
            return new NameForRolleWithTrailingSpaceError();
        }
        return new Rolle(
            organisationRepo,
            serviceProviderRepo,
            undefined,
            undefined,
            undefined,
            undefined,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            systemrechte,
            serviceProviderIds,
            istTechnisch,
            serviceProviderData,
        );
    }

    public static async update(
        organisationRepo: OrganisationRepository,
        serviceProviderRepo: ServiceProviderRepo,
        id: string,
        createdAt: Date,
        updatedAt: Date,
        version: number,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
        istTechnisch: boolean,
        serviceProviderData?: ServiceProvider<true>[],
    ): Promise<Rolle<true> | DomainError> {
        if (!NameValidator.isNameValid(name)) {
            return new NameForRolleWithTrailingSpaceError();
        }

        const rolleToUpdate: Rolle<true> = new Rolle(
            organisationRepo,
            serviceProviderRepo,
            id,
            createdAt,
            updatedAt,
            version,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            systemrechte,
            [],
            istTechnisch,
            serviceProviderData ?? [],
        );
        //Replace service providers with new ones
        const attachmentResults: (void | DomainError)[] = await Promise.all(
            serviceProviderIds.map(async (serviceProviderId: string) => {
                return rolleToUpdate.attachServiceProvider(serviceProviderId);
            }),
        );

        const error: void | DomainError = attachmentResults.find(
            (result: void | DomainError) => result instanceof DomainError,
        );
        if (error instanceof DomainError) {
            return error;
        }
        return rolleToUpdate;
    }

    public static construct<WasPersisted extends boolean = false>(
        organisationRepo: OrganisationRepository,
        serviceProviderRepo: ServiceProviderRepo,
        id: string,
        createdAt: Date,
        updatedAt: Date,
        version: number,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
        istTechnisch: boolean,
        serviceProviderData: ServiceProvider<true>[] | undefined,
    ): Rolle<WasPersisted> {
        return new Rolle(
            organisationRepo,
            serviceProviderRepo,
            id,
            createdAt,
            updatedAt,
            version,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            systemrechte,
            serviceProviderIds,
            istTechnisch,
            serviceProviderData ?? [],
        );
    }

    public async canBeAssignedToOrga(
        orga: Organisation<true>,
    ): Promise<Result<void, EntityNotFoundError | OrganisationMatchesRollenartError>> {
        let isCorrectNodeOrSubtree: boolean;
        if (orga.id === this.administeredBySchulstrukturknoten) {
            isCorrectNodeOrSubtree = true;
        } else {
            isCorrectNodeOrSubtree = await this.organisationRepo.isOrgaAParentOfOrgaB(
                this.administeredBySchulstrukturknoten,
                orga.id,
            );
        }
        if (!isCorrectNodeOrSubtree) {
            return Err(new EntityNotFoundError('Rolle', this.id ?? 'undefined')); // Rolle does not exist for the chosen organisation
        }
        const rollenartMatchesOrganisation: OrganisationMatchesRollenart = new OrganisationMatchesRollenart();
        const doesRollenartMatchOrga: boolean = rollenartMatchesOrganisation.isSatisfiedBy(orga, this);
        if (!doesRollenartMatchOrga) {
            return Err(new OrganisationMatchesRollenartError());
        }
        return Ok(undefined);
    }

    public addMerkmal(merkmal: RollenMerkmal): void {
        if (!this.merkmale.includes(merkmal)) {
            this.merkmale.push(merkmal);
        }
    }

    public removeMerkmal(merkmal: RollenMerkmal): void {
        const idx: number = this.merkmale.indexOf(merkmal);
        if (idx !== -1) {
            this.merkmale.splice(idx, 1);
        }
    }

    public addSystemRecht(systemRecht: RollenSystemRecht): void {
        if (!this.systemrechte.includes(systemRecht)) {
            this.systemrechte.push(systemRecht);
        }
    }

    public hasSystemRecht(systemRecht: RollenSystemRecht): boolean {
        return this.systemrechte.includes(systemRecht);
    }

    public async attachServiceProvider(serviceProviderId: string): Promise<void | DomainError> {
        const serviceProvider: Option<ServiceProvider<true>> =
            await this.serviceProviderRepo.findById(serviceProviderId);
        if (!serviceProvider) {
            return new EntityNotFoundError('ServiceProvider', serviceProviderId);
        }

        if (this.serviceProviderIds.includes(serviceProviderId)) {
            return new EntityAlreadyExistsError('Rolle ServiceProvider Verknüpfung');
        }
        this.serviceProviderIds.push(serviceProviderId);
    }

    public detatchServiceProvider(serviceProviderIds: string[]): void | DomainError {
        // Find any serviceProviderIds that are not currently attached
        const missingServiceProviderIds: string[] = serviceProviderIds.filter(
            (id: string) => !this.serviceProviderIds.includes(id),
        );

        // If any IDs are missing, return an error indicating which ones were not found
        if (missingServiceProviderIds.length > 0) {
            return new EntityNotFoundError(
                'Rolle ServiceProvider Verknüpfung',
                `The following service-provider IDs were not found: ${missingServiceProviderIds.join(', ')}`,
            );
        }

        // Filter out all the serviceProviderIds that need to be detached
        this.serviceProviderIds = this.serviceProviderIds.filter((id: string) => !serviceProviderIds.includes(id));
    }

    public async updateServiceProviders(serviceProviderIds: string[]): Promise<void | DomainError> {
        const serviceProviderMap: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            serviceProviderIds,
        );

        const missingIds: string[] = serviceProviderIds.filter((id: string) => !serviceProviderMap.has(id));
        if (missingIds.length > 0) {
            return new EntityNotFoundError('ServiceProvider', missingIds.join(', '));
        }

        this.serviceProviderIds = serviceProviderIds;
    }

    public setVersionForUpdate(version: number): void {
        this.version = version;
    }
}
