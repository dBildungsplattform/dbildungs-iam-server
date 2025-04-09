import { Injectable } from '@nestjs/common';
import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { DbSeed } from '../domain/db-seed.js';
import { DbSeedEntity } from './db-seed.entity.js';

function mapAggregateToData(dbSeed: DbSeed<boolean>): RequiredEntityData<DbSeedEntity> {
    return {
        // Don't assign executedAt, it is auto-generated!
        hash: dbSeed.hash,
        status: dbSeed.status,
        path: dbSeed.path,
    };
}

function mapEntityToAggregate(entity: DbSeedEntity): DbSeed<boolean> {
    return DbSeed.construct(entity.hash, entity.executedAt, entity.status, entity.path);
}

@Injectable()
export class DbSeedRepo {
    public constructor(private em: EntityManager) {}

    /**
     * Returns TRUE if seeding table contains any seeding record, regardless of its status, FALSE vice versa.
     */
    public async existsSeeding(): Promise<boolean> {
        const dbSeedEntities: DbSeedEntity[] = await this.em.find(DbSeedEntity, {});

        return dbSeedEntities.length > 0;
    }

    public async create(dbSeed: DbSeed<false>): Promise<DbSeed<true>> {
        const dbSeedEntity: DbSeedEntity = this.em.create(DbSeedEntity, mapAggregateToData(dbSeed));

        await this.em.persistAndFlush(dbSeedEntity);

        return mapEntityToAggregate(dbSeedEntity);
    }

    public async update(dbSeed: DbSeed<true>): Promise<DbSeed<true>> {
        const dbSeedEntity: Loaded<DbSeedEntity> = await this.em.findOneOrFail(DbSeedEntity, { hash: dbSeed.hash });
        dbSeedEntity.assign(mapAggregateToData(dbSeed));

        await this.em.persistAndFlush(dbSeedEntity);

        return mapEntityToAggregate(dbSeedEntity);
    }

    public forkEntityManager(): void {
        this.em = this.em.fork();
    }
}
