import { EntityData, EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMerkmal } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';

@Injectable()
export class RolleRepo {
    public constructor(private readonly em: EntityManager) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: string): Promise<Option<Rolle<true>>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(
            this.entityName,
            { id },
            { populate: ['merkmale'] as const },
        );

        return rolle && RolleRepo.mapEntityToAggregate(rolle);
    }

    public async save(rolle: Rolle<boolean>): Promise<Rolle<true>> {
        if (rolle.id) {
            return this.update(rolle);
        } else {
            return this.create(rolle);
        }
    }

    private async create(rolle: Rolle<false>): Promise<Rolle<true>> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, RolleRepo.mapAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return RolleRepo.mapEntityToAggregate(rolleEntity);
    }

    private async update(rolle: Rolle<true>): Promise<Rolle<true>> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id);
        rolleEntity.assign(RolleRepo.mapAggregateToData(rolle), { merge: true });

        await this.em.persistAndFlush(rolleEntity);

        return RolleRepo.mapEntityToAggregate(rolleEntity);
    }

    public static mapAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
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

    public static mapEntityToAggregate(entity: RolleEntity): Rolle<boolean> {
        const merkmale: RollenMerkmal[] = entity.merkmale.map(
            (merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal,
        );

        return Rolle.construct(
            entity.id,
            entity.createdAt,
            entity.updatedAt,
            entity.name,
            entity.administeredBySchulstrukturknoten,
            entity.rollenart,
            merkmale,
        );
    }
}
