import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataConfig } from '../../../shared/config/data.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { UserLock } from '../domain/user.lock.js';
import { UserLockEntity } from '../entity/user-lock.entity.js';
import { randomUUID } from 'crypto';
import { DuplicatePersonalnummerError } from '../../../shared/error/duplicate-personalnummer.error.js';
import { DomainError } from '../../../shared/error/domain.error.js';

export function mapEntityToAggregate(entity: UserLockEntity): UserLock<true> {
    return UserLock.construct(entity.personId, entity.locked_by, entity.locked_until);
}

export function mapAggregateToData(userLock: UserLock<boolean>): RequiredEntityData<UserLockEntity> {
    return {
        personId: userLock.personId!,
        locked_by: userLock.locked_by,
        locked_until: userLock.locked_until!,
    };
}

export function mapEntityToAggregateInplace(entity: UserLockEntity, userLock: UserLock<boolean>): UserLock<true> {
    userLock.personId = entity.personId;
    userLock.locked_by = entity.locked_by;
    userLock.locked_until = entity.locked_until;

    return userLock;
}

@Injectable()
export class UserLockRepository {
    public readonly ROOT_ORGANISATION_ID: string;

    public constructor(
        private readonly em: EntityManager,
        config: ConfigService<ServerConfig>,
    ) {
        this.ROOT_ORGANISATION_ID = config.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;
    }

    public async findById(id: string): Promise<Option<UserLock<true>>> {
        const user: Option<UserLockEntity> = await this.em.findOne(UserLockEntity, { personId: id });
        if (user) {
            return mapEntityToAggregate(user);
        }
        return null;
    }

    public async createUserLock(userLock: UserLock<false>): Promise<UserLock<true> | DomainError> {
        const transaction: EntityManager = this.em.fork();
        await transaction.begin();

        try {
            // Check if personalnummer already exists
            const existingUserLock: Loaded<UserLockEntity, never, '*', never> | null = await transaction.findOne(
                UserLockEntity,
                { personId: userLock.personId },
            );
            if (existingUserLock) {
                await transaction.rollback();
                return new DuplicatePersonalnummerError(`User-Lock ${userLock.personId} already exists.`);
            }

            // Create DB userLock
            const userLockEntity: UserLockEntity = transaction
                .create(UserLockEntity, mapAggregateToData(userLock))
                .assign({
                    id: randomUUID(), // Generate ID here instead of at insert-time
                });
            transaction.persist(userLockEntity);
            // Commit
            await transaction.commit();

            // Return mapped userLock
            return mapEntityToAggregateInplace(userLockEntity, userLock);
        } catch (e) {
            // Any other errors
            // -> rollback and rethrow
            await transaction.rollback();
            throw e;
        }
    }

    public async update(userLock: UserLock<true>): Promise<UserLock<true> | DomainError> {
        const userLockEntity: Loaded<UserLockEntity> = await this.em.findOneOrFail(UserLockEntity, userLock.personId);

        userLockEntity.assign(mapAggregateToData(userLock));
        await this.em.persistAndFlush(userLockEntity);

        return mapEntityToAggregate(userLockEntity);
    }

    public async deleteUserLock(personId: string): Promise<Result<void, DomainError>> {
        await this.em.nativeDelete(UserLockEntity, { personId: personId });
        return { ok: true, value: undefined };
    }
}
