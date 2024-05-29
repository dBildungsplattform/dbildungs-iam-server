import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationEntity } from './organisation.entity.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationScope } from './organisation.scope.js';
import { ServerConfig, DataConfig } from '../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';

export function mapAggregateToData(organisation: Organisation<boolean>): RequiredEntityData<OrganisationEntity> {
    return {
        administriertVon: organisation.administriertVon,
        zugehoerigZu: organisation.zugehoerigZu,
        kennung: organisation.kennung,
        name: organisation.name,
        namensergaenzung: organisation.namensergaenzung,
        kuerzel: organisation.kuerzel,
        typ: organisation.typ,
        traegerschaft: organisation.traegerschaft,
    };
}

export function mapEntityToAggregate(entity: OrganisationEntity): Organisation<true> {
    return Organisation.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.administriertVon,
        entity.zugehoerigZu,
        entity.kennung,
        entity.name,
        entity.namensergaenzung,
        entity.kuerzel,
        entity.typ,
        entity.traegerschaft,
    );
}

@Injectable()
export class OrganisationRepository {
    public readonly ROOT_ORGANISATION_ID: string;

    public constructor(
        private readonly em: EntityManager,
        config: ConfigService<ServerConfig>,
    ) {
        this.ROOT_ORGANISATION_ID = config.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;
    }

    public async findBy(scope: OrganisationScope): Promise<Counted<Organisation<true>>> {
        const [entities, total]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);
        const organisations: Organisation<true>[] = entities.map((entity: OrganisationEntity) =>
            mapEntityToAggregate(entity),
        );

        return [organisations, total];
    }

    public async findRootDirectChildren(): Promise<Organisation<true>[]> {
        const scope: OrganisationScope = new OrganisationScope().findAdministrierteVon(this.ROOT_ORGANISATION_ID);

        const [entities]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);
        const organisations: Organisation<true>[] = entities.map((entity: OrganisationEntity) =>
            mapEntityToAggregate(entity),
        );

        return organisations;
    }
}
