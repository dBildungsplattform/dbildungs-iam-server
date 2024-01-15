import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager, EntityName, Loaded } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';

import { Rolle } from '../domain/rolle.js';
import { RolleEntity } from '../entity/rolle.entity.js';

@Injectable()
export class RolleRepo {
    public constructor(
        private readonly em: EntityManager,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: string): Promise<Option<Rolle>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(this.entityName, { id });
        return rolle && this.mapper.map(rolle, RolleEntity, Rolle);
    }

    public async save(rolle: Rolle): Promise<Rolle> {
        if (rolle.id) {
            return this.update(rolle);
        }
        return this.create(rolle);
    }

    private async create(rolle: Rolle): Promise<Rolle> {
        const rolleEntity: RolleEntity = this.mapper.map(rolle, Rolle, RolleEntity);
        await this.em.persistAndFlush(rolleEntity);
        return this.mapper.map(rolleEntity, RolleEntity, Rolle);
    }

    private async update(rolle: Rolle): Promise<Rolle> {
        let rolleEntity: Option<Loaded<RolleEntity, never>> = await this.em.findOne(this.entityName, {
            id: rolle.id,
        });

        if (rolleEntity) {
            rolleEntity.assign(this.mapper.map(rolle, Rolle, RolleEntity));
        } else {
            rolleEntity = this.mapper.map(rolle, Rolle, RolleEntity);
        }

        await this.em.persistAndFlush(rolleEntity);
        return this.mapper.map(rolleEntity, RolleEntity, Rolle);
    }
}
