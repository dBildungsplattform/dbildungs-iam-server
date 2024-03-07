import { Injectable } from '@nestjs/common';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from './rolle.js';
import { RollenArt, RollenMerkmal } from './rolle.enums.js';

@Injectable()
export class RolleFactory {
    public constructor(private serviceProviderRepo: ServiceProviderRepo) {}

    public construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        serviceProviderIds: string[],
    ): Rolle<true> {
        return Rolle.construct(
            this.serviceProviderRepo,
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

    public createNew(
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        serviceProviderIds?: string[],
    ): Rolle<false> {
        return Rolle.createNew(
            this.serviceProviderRepo,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            serviceProviderIds ?? [],
        );
    }
}
