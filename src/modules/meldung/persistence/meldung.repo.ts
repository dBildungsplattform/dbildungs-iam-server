import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Meldung } from '../domain/meldung.js';
import { MeldungEntity, MeldungStatus } from './meldung.entity.js';

export function mapAggregateToData(meldung: Meldung<boolean>): RequiredEntityData<MeldungEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: meldung.id,
        inhalt: meldung.inhalt,
        status: meldung.status,
        revision: meldung.revision,
    };
}

function mapEntityToAggregate(entity: MeldungEntity): Meldung<boolean> {
    return Meldung.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.inhalt,
        entity.status,
        entity.revision,
    );
}

@Injectable()
export class MeldungRepo {
    public constructor(private readonly em: EntityManager) {}

    public async findById(id: string): Promise<Option<Meldung<true>>> {
        const meldung: Option<MeldungEntity> = (await this.em.findOne(MeldungEntity, {
            id,
        })) as Option<MeldungEntity>;

        return meldung && mapEntityToAggregate(meldung);
    }

    public async findAll(): Promise<Meldung<true>[]> {
        const meldungen: MeldungEntity[] = await this.em.findAll(MeldungEntity, {});
        return meldungen.map((meldung: MeldungEntity) => mapEntityToAggregate(meldung));
    }

    public async save(meldung: Meldung<boolean>): Promise<Meldung<true>> {
        if (meldung.id) {
            return this.update(meldung);
        } else {
            return this.create(meldung);
        }
    }

    private async create(meldung: Meldung<false>): Promise<Meldung<true>> {
        const meldungEntity: MeldungEntity = this.em.create(MeldungEntity, mapAggregateToData(meldung));

        await this.em.persistAndFlush(meldungEntity);
        return mapEntityToAggregate(meldungEntity);
    }

    private async update(meldung: Meldung<true>): Promise<Meldung<true>> {
        const meldungEntity: Loaded<MeldungEntity> = await this.em.findOneOrFail(MeldungEntity, meldung.id);
        meldungEntity.assign(mapAggregateToData(meldung));

        await this.em.persistAndFlush(meldungEntity);

        return mapEntityToAggregate(meldungEntity);
    }

    public async getRecentVeroeffentlichtMeldung(): Promise<Meldung<true> | null> {
        const currentEntity: Option<MeldungEntity> = await this.em.findOne(
            MeldungEntity,
            { status: MeldungStatus.VEROEFFENTLICHT },
            { orderBy: { updatedAt: 'DESC' } },
        );
        return currentEntity ? mapEntityToAggregate(currentEntity) : null;
    }
}
