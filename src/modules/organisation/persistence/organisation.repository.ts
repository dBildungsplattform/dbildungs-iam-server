import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataConfig, ServerConfig } from '../../../shared/config/index.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationScope } from './organisation.scope.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { ScopeOperator } from '../../../shared/persistence/scope.enums.js';

export function mapAggregateToData(organisation: Organisation<boolean>): RequiredEntityData<OrganisationEntity> {
    return {
        id: organisation.id,
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
        private readonly eventService: EventService,
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

    public async save(organisation: Organisation<boolean>): Promise<Organisation<true>> {
        const organisationEntity: OrganisationEntity = this.em.create(
            OrganisationEntity,
            mapAggregateToData(organisation),
        );

        await this.em.persistAndFlush(organisationEntity);

        if (organisationEntity.typ === OrganisationsTyp.SCHULE) {
            this.eventService.publish(new SchuleCreatedEvent(organisationEntity.id));
        }

        return mapEntityToAggregate(organisationEntity);
    }

    public async exists(id: OrganisationID): Promise<boolean> {
        const organisation: Option<Loaded<OrganisationEntity, never, 'id', never>> = await this.em.findOne(
            OrganisationEntity,
            { id },
            { fields: ['id'] as const },
        );

        return !!organisation;
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

    public async findRootDirectChildren(): Promise<
        [oeffentlich: Organisation<true> | undefined, ersatz: Organisation<true> | undefined]
    > {
        const scope: OrganisationScope = new OrganisationScope().findAdministrierteVon(this.ROOT_ORGANISATION_ID);

        const [entities]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);

        const oeffentlich: OrganisationEntity | undefined = entities.find((entity: OrganisationEntity) =>
            entity.name?.includes('Öffentliche'),
        );

        const ersatz: OrganisationEntity | undefined = entities.find((entity: OrganisationEntity) =>
            entity.name?.includes('Ersatz'),
        );

        return [oeffentlich && mapEntityToAggregate(oeffentlich), ersatz && mapEntityToAggregate(ersatz)];
    }

    public async findById(id: string): Promise<Option<Organisation<true>>> {
        const organisation: Option<OrganisationEntity> = await this.em.findOne(OrganisationEntity, { id });
        if (organisation) {
            return mapEntityToAggregate(organisation);
        }
        return null;
    }

    public async findByIds(ids: string[]): Promise<Map<string, Organisation<true>>> {
        const organisationEntities: OrganisationEntity[] = await this.em.find(OrganisationEntity, { id: { $in: ids } });

        const organisationMap: Map<string, Organisation<true>> = new Map();
        organisationEntities.forEach((organisationEntity: OrganisationEntity) => {
            const organisation: Organisation<true> = mapEntityToAggregate(organisationEntity);
            organisationMap.set(organisationEntity.id, organisation);
        });

        return organisationMap;
    }

    public async findByNameOrKennungAndExcludeByOrganisationType(
        excludeOrganisationType: OrganisationsTyp,
        searchStr?: string,
        limit?: number,
    ): Promise<Organisation<true>[]> {
        const scope: OrganisationScope = new OrganisationScope();
        if (searchStr) {
            scope
                .searchString(searchStr)
                .setScopeWhereOperator(ScopeOperator.AND)
                .excludeTyp([excludeOrganisationType]);
        } else {
            scope.excludeTyp([excludeOrganisationType]).paged(0, limit);
        }

        let foundOrganisations: Organisation<true>[] = [];
        [foundOrganisations] = await this.findBy(scope);

        return foundOrganisations;
    }
}
