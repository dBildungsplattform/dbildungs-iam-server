import { Injectable } from '@nestjs/common';
import { RollenMapping } from './rollenmapping.js';
import { RolleID, ServiceProviderID } from '../../../shared/types/index.js';

@Injectable()
export class RollenMappingFactory {
    public construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
        mapToLmsRolle: string,
    ): RollenMapping<true> {
        return RollenMapping.construct(id, createdAt, updatedAt, rolleId, serviceProviderId, mapToLmsRolle);
    }

    public createNew(rolleId: string, serviceProviderId: string, mapToLmsRolle: string): RollenMapping<false> {
        return RollenMapping.createNew(rolleId, serviceProviderId, mapToLmsRolle);
    }

    public update(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
        mapToLmsRolle: string,
    ): RollenMapping<true> {
        return RollenMapping.update(id, createdAt, updatedAt, rolleId, serviceProviderId, mapToLmsRolle);
    }
}
