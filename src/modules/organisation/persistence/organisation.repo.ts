import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationEntity } from './organisation.entity.js';
import { Loaded } from '@mikro-orm/core';
import { OrganisationScope } from './organisation.scope.js';

@Injectable()
export class OrganisationRepo {
    public readonly rootOrganisationId: string = 'd4261bd1-74e3-4d0a-b6cc-1053f863f045';

    public constructor(
        private readonly em: EntityManager,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    private async create(organisationDo: OrganisationDo<false>): Promise<OrganisationDo<true>> {
        const organisation: OrganisationEntity = this.mapper.map(organisationDo, OrganisationDo, OrganisationEntity);
        await this.em.persistAndFlush(organisation);
        return this.mapper.map(organisation, OrganisationEntity, OrganisationDo);
    }

    public async save(organisationDo: OrganisationDo<boolean>): Promise<OrganisationDo<true>> {
        if (organisationDo.id) {
            return this.update(organisationDo);
        }
        return this.create(organisationDo);
    }

    private async update(organisationDo: OrganisationDo<true>): Promise<OrganisationDo<true>> {
        let organisation: Option<Loaded<OrganisationEntity, never>> = await this.em.findOne(OrganisationEntity, {
            id: organisationDo.id,
        });
        if (organisation) {
            organisation.assign(this.mapper.map(organisationDo, OrganisationDo, OrganisationEntity));
        } else {
            organisation = this.mapper.map(organisationDo, OrganisationDo, OrganisationEntity);
        }
        await this.em.persistAndFlush(organisation);
        return this.mapper.map(organisation, OrganisationEntity, OrganisationDo);
    }

    public async exists(id: string): Promise<boolean> {
        const organisation: Option<Loaded<OrganisationEntity, never, 'id', never>> = await this.em.findOne(
            OrganisationEntity,
            { id },
            { fields: ['id'] as const },
        );

        return !!organisation;
    }

    public async findById(id: string): Promise<Option<OrganisationDo<true>>> {
        const organisation: Option<OrganisationEntity> = await this.em.findOne(OrganisationEntity, { id });
        if (organisation) {
            return this.mapper.map(organisation, OrganisationEntity, OrganisationDo);
        }
        return null;
    }

    public async findByIds(ids: string[]): Promise<Map<string, OrganisationDo<true>>> {
        const organisations: OrganisationEntity[] = await this.em.find(OrganisationEntity, { id: { $in: ids } });
        const organisationMap: Map<string, OrganisationDo<true>> = new Map();

        organisations.forEach((organisation: OrganisationEntity) => {
            const organisationDo: OrganisationDo<true> = this.mapper.map(
                organisation,
                OrganisationEntity,
                OrganisationDo,
            );
            organisationMap.set(organisation.id, organisationDo);
        });

        return organisationMap;
    }

    public async findBy(scope: OrganisationScope): Promise<Counted<OrganisationDo<true>>> {
        const [entities, total]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);
        const dos: OrganisationDo<true>[] = this.mapper.mapArray(entities, OrganisationEntity, OrganisationDo);

        return [dos, total];
    }

    public async findByNameOrKennung(searchStr: string): Promise<Option<OrganisationDo<true>[]>> {
        const organisations: OrganisationEntity[] = await this.em.find(OrganisationEntity, {
            $or: [{ name: { $ilike: '%' + searchStr + '%' } }, { kennung: { $ilike: '%' + searchStr + '%' } }],
        });
        return this.mapper.mapArray(organisations, OrganisationEntity, OrganisationDo);
    }

    public async findChildOrgasForId(id: string): Promise<Option<OrganisationDo<true>[]>> {
        let rawResult: OrganisationEntity[];

        if (id === this.rootOrganisationId) {
            // If id is the root, perform a simple SELECT * except root for performance enhancement.
            rawResult = await this.em.find(OrganisationEntity, { id: { $ne: this.rootOrganisationId } });
        } else {
            // Otherwise, perform the recursive CTE query.
            const query: string = `
            WITH RECURSIVE sub_organisations AS (
                SELECT *
                FROM public.organisation
                WHERE administriert_von = '${id}'
                UNION ALL
                SELECT o.*
                FROM public.organisation o
                INNER JOIN sub_organisations so ON o.administriert_von = so.id
            )
            SELECT DISTINCT ON (id) * FROM sub_organisations;
            `;

            rawResult = await this.em.execute(query);
        }

        if (rawResult.length > 0) {
            return this.mapper.mapArray(rawResult, OrganisationEntity, OrganisationDo);
        }
        return null;
    }
}
