import { Injectable } from "@nestjs/common";
import { OrganisationID, RolleID, ServiceProviderID } from "../../../shared/types/aggregate-ids.types";
import { Organisation } from "../../organisation/domain/organisation";
import { OrganisationRepository } from "../../organisation/persistence/organisation.repository";
import { ServiceProvider } from "../../service-provider/domain/service-provider";
import { ServiceProviderRepo } from "../../service-provider/repo/service-provider.repo";
import { RolleRepo } from "../repo/rolle.repo";
import { Rolle } from "./rolle";
import { Rollenerweiterung } from "./rollenerweiterung";

export type RollenerweiterungWithName = {
    organisation: {
        id: OrganisationID;
        name: string;
    };
    rolle: {
        id: RolleID;
        name: string;
    };
    serviceProvider: {
        id: ServiceProviderID;
        name: string;
    };
}

@Injectable()
export class RollenerweiterungService {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {

    }

    public async extendRollenerweiterungenWithNames(rollenerweiterungen: Rollenerweiterung<true>[]): Promise<RollenerweiterungWithName[]> {
        const organisationen: Map<OrganisationID, Organisation<true>> = await this.organisationRepo.findByIds(rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.organisationId));
        const rollen: Map<RolleID, Rolle<true>> = await this.rolleRepo.findByIds(rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.rolleId));
        const serviceProvider: Map<ServiceProviderID, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.serviceProviderId));

        return rollenerweiterungen.map((rollenerweiterung: Rollenerweiterung<true>) => ({
            organisation: {
                id: rollenerweiterung.organisationId,
                name: organisationen.get(rollenerweiterung.organisationId)?.name ?? '',
            },
            rolle: {
                id: rollenerweiterung.rolleId,
                name: rollen.get(rollenerweiterung.rolleId)?.name ?? '',
            },
            serviceProvider: {
                id: rollenerweiterung.serviceProviderId,
                name: serviceProvider.get(rollenerweiterung.serviceProviderId)?.name ?? '',
            },
        }));
    }
}
