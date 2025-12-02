import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailAddressStatusEntity } from './email-address-status.entity.js';
import { EmailAddressStatus } from '../domain/email-address-status.js';

export function mapAggregateToData(
    emailAddressStatus: EmailAddressStatus<boolean>,
): RequiredEntityData<EmailAddressStatusEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailAddressStatus.id,
        emailAddress: emailAddressStatus.emailAddressId,
        status: emailAddressStatus.status,
    };
}

export function mapEntityToAggregate(entity: EmailAddressStatusEntity): EmailAddressStatus<boolean> {
    return EmailAddressStatus.construct({
        id: entity.id,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        emailAddressId: entity.emailAddress.id,
        status: entity.status,
    });
}

@Injectable()
export class EmailAddressStatusRepo {
    public constructor(private readonly em: EntityManager) {}

    //No Save since entries should not be updated (Only created)
    public async create(emailAddressStatus: EmailAddressStatus<boolean>): Promise<EmailAddressStatus<true>> {
        const emailAddressStatusEntity: EmailAddressStatusEntity = this.em.create(
            EmailAddressStatusEntity,
            mapAggregateToData(emailAddressStatus),
        );
        await this.em.persistAndFlush(emailAddressStatusEntity);

        return mapEntityToAggregate(emailAddressStatusEntity);
    }

    public async findAllByEmailAddressIdSortedByCreatedAtDesc(
        emailAddressId: string,
    ): Promise<EmailAddressStatus<true>[]> {
        const entities: EmailAddressStatusEntity[] = await this.em.find(
            EmailAddressStatusEntity,
            { emailAddress: emailAddressId },
            { orderBy: { createdAt: 'desc' } },
        );
        return entities.map(mapEntityToAggregate);
    }
}
