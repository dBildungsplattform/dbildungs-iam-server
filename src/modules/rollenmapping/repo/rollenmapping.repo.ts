import { EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMapping } from '../domain/rollenmapping.js';
import { RollenMappingEntity } from '../entity/rollenmapping.entity.js';

export function mapRolleAggregateToData(rolle: RollenMapping<boolean>): RequiredEntityData<RollenMappingEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rolle.id,
        rolleId: rolle.rolleId,
        serviceProviderId: rolle.serviceProviderId,
        mapToLmsRolle: rolle.mapToLmsRolle,
    };
}

export function mapRolleEntityToAggregate(entity: RollenMappingEntity): RollenMapping<boolean> {
    return RollenMapping.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.rolleId.unwrap().id,
        entity.serviceProviderId.unwrap().id,
        entity.mapToLmsRolle,
    );
}

@Injectable()
export class RolleRepo {
    public constructor(protected readonly em: EntityManager) {}

    public get entityName(): EntityName<RollenMappingEntity> {
        return RollenMappingEntity;
    }

    public async findById(id: string): Promise<Option<RollenMapping<true>>> {
        const query: { id: string } = { id };

        const rolle: Option<RollenMappingEntity> = await this.em.findOne(this.entityName, query);

        return rolle && mapRolleEntityToAggregate(rolle);
    }

    public async findByIds(ids: string[]): Promise<Map<string, RollenMapping<true>>> {
        const rollenEntities: RollenMappingEntity[] = await this.em.find(RollenMappingEntity, { id: { $in: ids } });

        const rollenMappingMap: Map<string, RollenMapping<true>> = new Map();
        rollenEntities.forEach((rolleEntity: RollenMappingEntity) => {
            const rolle: RollenMapping<true> = mapRolleEntityToAggregate(rolleEntity);
            rollenMappingMap.set(rolleEntity.id, rolle);
        });

        return rollenMappingMap;
    }

    public async save(rolle: RollenMapping<boolean>): Promise<RollenMapping<true>> {
        if (rolle.id) {
            return this.update(rolle);
        } else {
            return this.create(rolle);
        }
    }

    public async delete(id: string): Promise<void> {
        const rollenMappingEntity: Loaded<RollenMappingEntity> = await this.em.findOneOrFail(RollenMappingEntity, id);
        await this.em.removeAndFlush(rollenMappingEntity);
    }

    public async create(rolle: RollenMapping<false>): Promise<RollenMapping<true>> {
        const rolleEntity: RollenMappingEntity = this.em.create(RollenMappingEntity, mapRolleAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return mapRolleEntityToAggregate(rolleEntity);
    }

    private async update(rolle: RollenMapping<true>): Promise<RollenMapping<true>> {
        const rolleEntity: Loaded<RollenMappingEntity> = await this.em.findOneOrFail(RollenMappingEntity, rolle.id);

        rolleEntity.assign(mapRolleAggregateToData(rolle), { updateNestedEntities: true });
        await this.em.persistAndFlush(rolleEntity);

        return mapRolleEntityToAggregate(rolleEntity);
    }
}
