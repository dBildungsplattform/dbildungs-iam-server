import { EntityData, EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMerkmal } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleFactory } from '../domain/rolle.factory.js';

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
    const merkmale: EntityData<RolleMerkmalEntity>[] = rolle.merkmale.map((merkmal: RollenMerkmal) => ({
        rolle: rolle.id,
        merkmal,
    }));

    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rolle.id,
        name: rolle.name,
        administeredBySchulstrukturknoten: rolle.administeredBySchulstrukturknoten,
        rollenart: rolle.rollenart,
        merkmale,
    };
}

function mapEntityToAggregate(entity: RolleEntity, rolleFactory: RolleFactory): Rolle<boolean> {
    const merkmale: RollenMerkmal[] = entity.merkmale.map((merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal);

    return rolleFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.administeredBySchulstrukturknoten,
        entity.rollenart,
        merkmale,
    );
}
@Injectable()
export class RolleRepo {
    public constructor(
        private readonly rolleFactory: RolleFactory,
        private readonly em: EntityManager,
    ) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: string): Promise<Option<Rolle<true>>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(
            this.entityName,
            { id },
            { populate: ['merkmale', 'serviceProvider'] as const },
        );

        return rolle && mapEntityToAggregate(rolle, this.rolleFactory);
    }

    public async find(): Promise<Rolle<true>[]> {
        const rollen: RolleEntity[] = await this.em.findAll(RolleEntity, {
            populate: ['merkmale', 'serviceProvider'] as const,
        });

        return rollen.map((rolle: RolleEntity) => mapEntityToAggregate(rolle, this.rolleFactory));
    }

    public async save(rolle: Rolle<boolean>): Promise<Rolle<true>> {
        if (rolle.id) {
            return this.update(rolle);
        } else {
            return this.create(rolle);
        }
    }

    private async create(rolle: Rolle<false>): Promise<Rolle<true>> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, mapAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return mapEntityToAggregate(rolleEntity, this.rolleFactory);
    }

    private async update(rolle: Rolle<true>): Promise<Rolle<true>> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id);
        rolleEntity.assign(mapAggregateToData(rolle), { merge: true });

        await this.em.persistAndFlush(rolleEntity);

        return mapEntityToAggregate(rolleEntity, this.rolleFactory);
    }
}
