import { Injectable } from '@nestjs/common';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from './rolle.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from './rolle.enums.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { DomainError } from '../../../shared/error/domain.error.js';

@Injectable()
export class RolleFactory {
    public constructor(
        private organisationRepo: OrganisationRepository,
        private serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public construct(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
    ): Rolle<true> {
        return Rolle.construct(
            this.organisationRepo,
            this.serviceProviderRepo,
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

    public createNew(
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds?: string[],
    ): Rolle<false> | DomainError {
        return Rolle.createNew(
            this.organisationRepo,
            this.serviceProviderRepo,
            name,
            administeredBySchulstrukturknoten,
            rollenart,
            merkmale,
            systemrechte,
            serviceProviderIds ?? [],
        );
    }

    public async update(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
    ): Promise<Rolle<true> | DomainError> {
        return Rolle.update(
            this.organisationRepo,
            this.serviceProviderRepo,
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
}
