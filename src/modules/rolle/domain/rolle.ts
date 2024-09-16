import { DomainError } from '../../../shared/error/domain.error.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from './rolle.enums.js';
import { EntityAlreadyExistsError, EntityNotFoundError } from '../../../shared/error/index.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { NameValidator } from '../../../shared/validation/name-validator.js';
import { NameForRolleWithTrailingSpaceError } from './name-with-trailing-space.error.js';

export class Rolle<WasPersisted extends boolean> {
    private constructor(
        public organisationRepo: OrganisationRepository,
        public serviceProviderRepo: ServiceProviderRepo,
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
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

        if (attachmentResults.some((result: void | DomainError) => result instanceof DomainError)) {
            return attachmentResults.find((result: void | DomainError) => result instanceof DomainError) as DomainError;
        }

        return rolleToUpdate;
    }

    public static construct<WasPersisted extends boolean = false>(
        organisationRepo: OrganisationRepository,
        serviceProviderRepo: ServiceProviderRepo,
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
        istTechnisch: boolean,
        serviceProviderData: ServiceProvider<true>[] = [],
    ): Rolle<WasPersisted> {
        return new Rolle(
            organisationRepo,
            serviceProviderRepo,
            id,
            createdAt,
            updatedAt,
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

    public async canBeAssignedToOrga(orgaId: OrganisationID): Promise<boolean> {
        if (orgaId === this.administeredBySchulstrukturknoten) return true;
        return this.organisationRepo.isOrgaAParentOfOrgaB(this.administeredBySchulstrukturknoten, orgaId);
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

    public detatchServiceProvider(serviceProviderId: string): void | DomainError {
        if (!this.serviceProviderIds.includes(serviceProviderId)) {
            return new EntityNotFoundError('Rolle ServiceProvider Verknüpfung', serviceProviderId);
        }
        this.serviceProviderIds = this.serviceProviderIds.filter((id: string) => id !== serviceProviderId);
    }
}
