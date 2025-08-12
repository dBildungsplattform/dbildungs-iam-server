import { RolleID, ServiceProviderID } from '../../../shared/types/index.js';

export class RollenMapping<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public rolleId: RolleID,
        public serviceProviderId: ServiceProviderID,
        public mapToLmsRolle: string,
    ) {}

    public static createNew(rolleId: string, serviceProviderId: string, mapToLmsRolle: string): RollenMapping<false> {
        return new RollenMapping(undefined, undefined, undefined, rolleId, serviceProviderId, mapToLmsRolle);
    }

    public static update(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
        mapToLmsRolle: string,
    ): RollenMapping<true> {
        const updatedMapping: RollenMapping<true> = new RollenMapping(
            id,
            createdAt,
            updatedAt,
            rolleId,
            serviceProviderId,
            mapToLmsRolle,
        );
        return updatedMapping;
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
        mapToLmsRolle: string,
    ): RollenMapping<WasPersisted> {
        return new RollenMapping(id, createdAt, updatedAt, rolleId, serviceProviderId, mapToLmsRolle);
    }
}
