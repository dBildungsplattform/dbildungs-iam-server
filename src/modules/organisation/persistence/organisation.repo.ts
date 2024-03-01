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

    public async findBy(scope: OrganisationScope): Promise<Counted<OrganisationDo<true>>> {
        const [entities, total]: Counted<OrganisationEntity> = await scope.executeQuery(this.em);
        const dos: OrganisationDo<true>[] = this.mapper.mapArray(entities, OrganisationEntity, OrganisationDo);

        return [dos, total];
    }

    public async findByName(name: string): Promise<Option<OrganisationDo<true>[]>> {
        const organisations: OrganisationEntity[] = await this.em.find(OrganisationEntity, { name: { $like: name } });
        return organisations.map((o: OrganisationEntity) => this.mapper.map(o, OrganisationEntity, OrganisationDo));
    }
}
