import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationEntity } from './organisation.entity.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationScope } from './organisation.scope.js';
import { OrganisationID } from '../../../shared/types/index.js';

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
    public constructor(private readonly em: EntityManager) {}

    public async findById(id: OrganisationID): Promise<Option<Organisation<true>>> {
        const organisation: Option<OrganisationEntity> = await this.em.findOne(OrganisationEntity, {
            id,
        });
        if (organisation) {
            return mapEntityToAggregate(organisation);
        }
        return null;
    }

    public async findBy(scope: OrganisationScope): Promise<Counted<Organisation<true>>> {
        const [entities, total]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);
        const organisations: Organisation<true>[] = entities.map((entity: OrganisationEntity) =>
            mapEntityToAggregate(entity),
        );

        return [organisations, total];
    }
}
