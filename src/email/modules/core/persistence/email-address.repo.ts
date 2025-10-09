import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailAddrEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/aggregates/email-address.js';
import { DomainError } from '../../../../shared/error/index.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';

export function mapAggregateToData(emailAddress: EmailAddress<boolean>): RequiredEntityData<EmailAddrEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailAddress.id,
        address: emailAddress.address,
        priority: emailAddress.priority,
        spshPersonId: emailAddress.spshPersonId,
        oxUserId: emailAddress.oxUserId,
        markedForCron: emailAddress.markedForCron,
    };
}

function mapEntityToAggregate(entity: EmailAddrEntity): EmailAddress<boolean> {
    return EmailAddress.construct({
        id: entity.id,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        address: entity.address,
        priority: entity.priority,
        spshPersonId: entity.spshPersonId,
        oxUserId: entity.oxUserId,
        markedForCron: entity.markedForCron,
    });
}

@Injectable()
export class EmailAddressRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async existsEmailAddress(address: string): Promise<boolean> {
        const emailAddressEntity: Option<EmailAddrEntity> = await this.em.findOne(
            EmailAddrEntity,
            { address: address },
            {},
        );

        return !!emailAddressEntity;
    }

    public async findBySpshPersonIdSortedByPriorityAsc(spshPersonId: string): Promise<EmailAddress<true>[]> {
        const emailAddressEntities: Option<EmailAddrEntity[]> = await this.em.find(
            EmailAddrEntity,
            { spshPersonId: { $eq: spshPersonId } },
            { orderBy: { priority: 'asc' } },
        );

        return emailAddressEntities.map(mapEntityToAggregate);
    }

    public async save(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        if (emailAddress.id) {
            return this.update(emailAddress);
        } else {
            return this.create(emailAddress);
        }
    }

    private async create(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        const emailAddressEntity: EmailAddrEntity = this.em.create(EmailAddrEntity, mapAggregateToData(emailAddress));
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntityToAggregate(emailAddressEntity);
    }

    private async update(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        const emailAddressEntity: Option<EmailAddrEntity> = await this.em.findOne(EmailAddrEntity, {
            id: emailAddress.id,
        });

        if (emailAddressEntity) {
            emailAddressEntity.assign(mapAggregateToData(emailAddress), {});
            await this.em.persistAndFlush(emailAddressEntity);
        } else {
            this.logger.error(`Email-Address:${emailAddress.address} with id ${emailAddress.id} could not be found`);
            return new EmailAddressNotFoundError(emailAddress.address);
        }

        return mapEntityToAggregate(emailAddressEntity);
    }
}
