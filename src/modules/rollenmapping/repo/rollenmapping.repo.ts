import { EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMapping } from '../domain/rollenmapping.js';
import { RollenMappingEntity } from '../entity/rollenmapping.entity.js';
import { RollenMappingFactory } from '../domain/rollenmapping.factory.js';

export function mapRollenMappingAggregateToData(
    rollenMapping: RollenMapping<boolean>,
): RequiredEntityData<RollenMappingEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rollenMapping.id,
        rolleId: rollenMapping.rolleId,
        serviceProviderId: rollenMapping.serviceProviderId,
        mapToLmsRolle: rollenMapping.mapToLmsRolle,
    };
}

export function mapRollenMappingEntityToAggregate(
    entity: RollenMappingEntity,
    rollenMappingFactory: RollenMappingFactory,
): RollenMapping<boolean> {
    return rollenMappingFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.rolleId.unwrap().id,
        entity.serviceProviderId.unwrap().id,
        entity.mapToLmsRolle,
    );
}

@Injectable()
export class RollenMappingRepo {
    public constructor(
        protected readonly rollenMappingFactory: RollenMappingFactory,
        protected readonly em: EntityManager,
    ) {}

    public get entityName(): EntityName<RollenMappingEntity> {
        return RollenMappingEntity;
    }

    public async findById(id: string): Promise<Option<RollenMapping<true>>> {
        const query: { id: string } = { id };

        const rollenMapping: Option<RollenMappingEntity> = await this.em.findOne(this.entityName, query);

        return rollenMapping && mapRollenMappingEntityToAggregate(rollenMapping, this.rollenMappingFactory);
    }

    public async find(limit?: number, offset?: number): Promise<RollenMapping<true>[]> {
        const rollenMappingEntities: RollenMappingEntity[] = await this.em.findAll(RollenMappingEntity, {
            limit: limit,
            offset: offset,
        });

        return rollenMappingEntities.map((rollenMappingEntity: RollenMappingEntity) =>
            mapRollenMappingEntityToAggregate(rollenMappingEntity, this.rollenMappingFactory),
        );
    }

    public async save(rollenMapping: RollenMapping<boolean>): Promise<RollenMapping<true>> {
        if (rollenMapping.id) {
            return this.update(rollenMapping);
        } else {
            return this.create(rollenMapping);
        }
    }

    public async delete(id: string): Promise<void> {
        const rollenMappingEntity: Loaded<RollenMappingEntity> = await this.em.findOneOrFail(RollenMappingEntity, id);
        await this.em.removeAndFlush(rollenMappingEntity);
    }

    public async create(rollenMapping: RollenMapping<false>): Promise<RollenMapping<true>> {
        const rollenMappingEntity: RollenMappingEntity = this.em.create(
            RollenMappingEntity,
            mapRollenMappingAggregateToData(rollenMapping),
        );

        await this.em.persistAndFlush(rollenMappingEntity);

        return mapRollenMappingEntityToAggregate(rollenMappingEntity, this.rollenMappingFactory);
    }

    private async update(rollenMapping: RollenMapping<true>): Promise<RollenMapping<true>> {
        const rollenMappingEntity: Loaded<RollenMappingEntity> = await this.em.findOneOrFail(
            RollenMappingEntity,
            rollenMapping.id,
        );

        rollenMappingEntity.assign(mapRollenMappingAggregateToData(rollenMapping));
        await this.em.persistAndFlush(rollenMappingEntity);

        return mapRollenMappingEntityToAggregate(rollenMappingEntity, this.rollenMappingFactory);
    }
}
