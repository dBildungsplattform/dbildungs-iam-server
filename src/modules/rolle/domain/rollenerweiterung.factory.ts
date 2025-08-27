import { Injectable } from '@nestjs/common';
import {
    OrganisationID,
    RolleID,
    RollenerweiterungID,
    ServiceProviderID,
} from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { Rollenerweiterung } from './rollenerweiterung.js';

@Injectable()
export class RollenerweiterungFactory {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public construct(
        id: RollenerweiterungID,
        createdAt: Date,
        updatedAt: Date,
        organisationId: OrganisationID,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
    ): Rollenerweiterung<true> {
        return Rollenerweiterung.construct<true>(
            this.organisationRepo,
            this.rolleRepo,
            this.serviceProviderRepo,
            id,
            createdAt,
            updatedAt,
            organisationId,
            rolleId,
            serviceProviderId,
        );
    }

    public createNew(
        organisationId: OrganisationID,
        rolleId: RolleID,
        serviceProviderId: ServiceProviderID,
    ): Rollenerweiterung<false> {
        return Rollenerweiterung.createNew(
            this.organisationRepo,
            this.rolleRepo,
            this.serviceProviderRepo,
            organisationId,
            rolleId,
            serviceProviderId,
        );
    }
}
