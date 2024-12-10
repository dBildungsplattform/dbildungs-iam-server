import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { OxUserBlacklistEntry } from '../domain/ox-user-blacklist-entry.js';
import { OxUserBlacklistEntity } from './ox-user-blacklist.entity.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { OXEmail, OXUserName } from '../../../shared/types/ox-ids.types.js';

export function mapAggregateToData(
    oxUserBlacklistEntry: OxUserBlacklistEntry<boolean>,
): RequiredEntityData<OxUserBlacklistEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: oxUserBlacklistEntry.id,
        email: oxUserBlacklistEntry.email,
        name: oxUserBlacklistEntry.name,
        username: oxUserBlacklistEntry.username,
    };
}

function mapEntityToAggregate(entity: OxUserBlacklistEntity): OxUserBlacklistEntry<boolean> {
    return new OxUserBlacklistEntry(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.email,
        entity.name,
        entity.username,
    );
}

@Injectable()
export class OxUserBlacklistRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async findByEmail(email: OXEmail): Promise<Option<OxUserBlacklistEntry<true>>> {
        const oxUserBlacklistEntity: Option<OxUserBlacklistEntity> = await this.em.findOne(OxUserBlacklistEntity, {
            email,
        });
        if (oxUserBlacklistEntity) {
            return mapEntityToAggregate(oxUserBlacklistEntity);
        }

        return null;
    }

    public async findByOxUsername(oxUsername: OXUserName): Promise<Option<OxUserBlacklistEntry<true>>> {
        const oxUserBlacklistEntity: Option<OxUserBlacklistEntity> = await this.em.findOne(OxUserBlacklistEntity, {
            username: oxUsername,
        });
        if (oxUserBlacklistEntity) {
            return mapEntityToAggregate(oxUserBlacklistEntity);
        }

        return null;
    }

    /**
     * Creates or updates OxUserBlacklistEntity in database.
     * @param oxUserBlacklistEntry
     */
    public async save(
        oxUserBlacklistEntry: OxUserBlacklistEntry<boolean>,
    ): Promise<OxUserBlacklistEntry<true> | DomainError> {
        if (oxUserBlacklistEntry.id) {
            return this.update(oxUserBlacklistEntry);
        } else {
            return this.create(oxUserBlacklistEntry);
        }
    }

    private async create(oxUserBlacklistEntry: OxUserBlacklistEntry<boolean>): Promise<OxUserBlacklistEntry<true>> {
        const oxUserBlacklistEntity: OxUserBlacklistEntity = this.em.create(
            OxUserBlacklistEntity,
            mapAggregateToData(oxUserBlacklistEntry),
        );
        await this.em.persistAndFlush(oxUserBlacklistEntity);

        return mapEntityToAggregate(oxUserBlacklistEntity);
    }

    private async update(
        oxUserBlacklistEntry: OxUserBlacklistEntry<boolean>,
    ): Promise<OxUserBlacklistEntry<true> | DomainError> {
        const oxUserBlacklistEntity: Option<OxUserBlacklistEntity> = await this.em.findOne(OxUserBlacklistEntity, {
            id: oxUserBlacklistEntry.id,
        });

        if (!oxUserBlacklistEntity) {
            this.logger.error(
                `Could Not Find OxUserBlacklistEntity, oxUserBlacklistEntryId:${oxUserBlacklistEntry.id}`,
            );
            return new EntityNotFoundError('OxUserBlacklistEntity');
        }

        oxUserBlacklistEntity.assign(mapAggregateToData(oxUserBlacklistEntry));
        await this.em.persistAndFlush(oxUserBlacklistEntity);

        return mapEntityToAggregate(oxUserBlacklistEntity);
    }
}
