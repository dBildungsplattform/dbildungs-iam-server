import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailDomainEntity } from './email-domain.entity.js';
import { EmailDomain } from '../domain/email-domain.js';

export function mapAggregateToData(emailDomain: EmailDomain<boolean>): RequiredEntityData<EmailDomainEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailDomain.id,
        domain: emailDomain.domain,
    };
}

function mapEntityToAggregate(entity: EmailDomainEntity): EmailDomain<boolean> {
    return new EmailDomain(entity.id, entity.createdAt, entity.updatedAt, entity.domain);
}

@Injectable()
export class EmailDomainRepo {
    public constructor(private readonly em: EntityManager) {}

    public async findById(emailDomainId: string): Promise<Option<EmailDomain<true>>> {
        const emailDomainEntity: Option<EmailDomainEntity> = await this.em.findOne(EmailDomainEntity, {
            id: { $eq: emailDomainId },
        });

        if (emailDomainEntity) {
            return mapEntityToAggregate(emailDomainEntity);
        }

        return null;
    }
}
