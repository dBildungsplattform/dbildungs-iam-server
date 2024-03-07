import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityCouldNotBeDeleted } from '../../../shared/error/entity-could-not-be-deleted.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RollenArt, RollenMerkmal } from './rolle.enums.js';

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
        public serviceProviderIds: string[],
    ) {}

    public static createNew(
        serviceProviderRepo: ServiceProviderRepo,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        serviceProviderIds: string[],
    ): Rolle<false> {
        const rolle: Rolle<false> = new Rolle(
            serviceProviderRepo,
            undefined,
            undefined,
            undefined,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            serviceProviderIds,
        );

        return rolle;
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

    public async attachServiceProvider(serviceProviderId: string): Promise<void | DomainError> {
        const serviceProvider: Option<ServiceProvider<true>> =
            await this.serviceProviderRepo.findById(serviceProviderId);
        if (!serviceProvider) {
            return new EntityNotFoundError('ServiceProvider', serviceProviderId);
        }

        if (this.serviceProviderIds.includes(serviceProviderId)) {
            return new EntityCouldNotBeCreated('Rolle ServiceProvider Verknüpfung');
        }
        this.serviceProviderIds.push(serviceProviderId);
    }

    public detatchServiceProvider(serviceProviderId: string): void | DomainError {
        if (!this.serviceProviderIds.includes(serviceProviderId)) {
            return new EntityCouldNotBeDeleted('Rolle ServiceProvider Verknüpfung', serviceProviderId);
        }
        this.serviceProviderIds = this.serviceProviderIds.filter((id: string) => id !== serviceProviderId);
    }
}
