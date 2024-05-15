import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrganisationEntity } from './organisation.entity.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationScope } from './organisation.scope.js';
import { ConfigService } from '@nestjs/config';
import { ServerConfig, DataConfig } from '../../../shared/config/index.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';

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

    public async findChildOrgasForIds(ids: OrganisationID[]): Promise<Organisation<true>[]> {
        let rawResult: OrganisationEntity[];

        if (ids.length === 0) {
            return [];
        } else if (ids.some((id: OrganisationID) => id === this.ROOT_ORGANISATION_ID)) {
            // If id is the root, perform a simple SELECT * except root for performance enhancement.
            rawResult = await this.em.find(OrganisationEntity, { id: { $ne: this.ROOT_ORGANISATION_ID } });
        } else {
            // Otherwise, perform the recursive CTE query.
            const query: string = `
            WITH RECURSIVE sub_organisations AS (
                SELECT *
                FROM public.organisation
                WHERE administriert_von IN (?)
                UNION ALL
                SELECT o.*
                FROM public.organisation o
                INNER JOIN sub_organisations so ON o.administriert_von = so.id
            )
            SELECT DISTINCT ON (id) * FROM sub_organisations;
            `;

            rawResult = await this.em.execute(query, [ids]);
        }

        return rawResult.map(mapEntityToAggregate);
    }
}
