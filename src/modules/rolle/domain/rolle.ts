import { DomainError } from '../../../shared/error/domain.error.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from './rolle.enums.js';
import { EntityAlreadyExistsError, EntityNotFoundError } from '../../../shared/error/index.js';

export class Rolle<WasPersisted extends boolean> {
    private constructor(
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
    ) {}

    public static createNew(
        serviceProviderRepo: ServiceProviderRepo,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
    ): Rolle<false> {
        return new Rolle(
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
        );
    }

    public static construct<WasPersisted extends boolean = false>(
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
    ): Rolle<WasPersisted> {
        return new Rolle(
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
        );
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
