import { EntityData, EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenMerkmal, RollenSystemRecht } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleID } from '../../../shared/types/index.js';
import { RolleSystemrechtEntity } from '../entity/rolle-systemrecht.entity.js';

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
    const merkmale: EntityData<RolleMerkmalEntity>[] = rolle.merkmale.map((merkmal: RollenMerkmal) => ({
        rolle: rolle.id,
        merkmal,
    }));
    const systemrechte: EntityData<RolleSystemrechtEntity>[] = rolle.systemrechte.map(
        (systemrecht: RollenSystemRecht) => ({
            rolle: rolle.id,
            systemrecht,
        }),
    );
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rolle.id,
        name: rolle.name,
        administeredBySchulstrukturknoten: rolle.administeredBySchulstrukturknoten,
        rollenart: rolle.rollenart,
        merkmale,
        systemrechte,
    };
}

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapEntityToAggregate(entity: RolleEntity): Rolle<boolean> {
    const merkmale: RollenMerkmal[] = entity.merkmale.map((merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal);
    const systemrechte: RollenSystemRecht[] = entity.systemrechte.map(
        (systemRechtEntity: RolleSystemrechtEntity) => systemRechtEntity.systemrecht,
    );

    return Rolle.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.administeredBySchulstrukturknoten,
        entity.rollenart,
        merkmale,
        systemrechte,
    );
}
@Injectable()
export class RolleRepo {
    public static readonly DEFAULT_LIMIT: number = 25;

    public constructor(protected readonly em: EntityManager) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: string): Promise<Option<Rolle<true>>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(
            this.entityName,
            { id },
            { populate: ['merkmale', 'systemrechte'] as const },
        );

        return rolle && mapEntityToAggregate(rolle);
    }

    public async findByName(searchStr: string, limit: number): Promise<Option<Rolle<true>[]>> {
        const rollen: Option<RolleEntity[]> = await this.em.find(
            this.entityName,
            { name: { $ilike: '%' + searchStr + '%' } },
            { populate: ['merkmale', 'systemrechte'] as const, limit: limit },
        );
        return rollen.map(mapEntityToAggregate);
    }

    public async find(): Promise<Rolle<true>[]> {
        const rollen: RolleEntity[] = await this.em.findAll(RolleEntity, {
            populate: ['merkmale', 'systemrechte'] as const,
        });

        return rollen.map(mapEntityToAggregate);
    }

    public async exists(id: RolleID): Promise<boolean> {
        const rolle: Option<Loaded<RolleEntity, never, 'id', never>> = await this.em.findOne(
            RolleEntity,
            { id },
            { fields: ['id'] as const },
        );

        return !!rolle;
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

        return mapEntityToAggregate(rolleEntity);
    }

    private async update(rolle: Rolle<true>): Promise<Rolle<true>> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id, {
            populate: ['merkmale', 'systemrechte'] as const,
        });
        rolleEntity.assign(mapAggregateToData(rolle), { updateNestedEntities: true });

        await this.em.persistAndFlush(rolleEntity);

        return mapEntityToAggregate(rolleEntity);
    }
}
