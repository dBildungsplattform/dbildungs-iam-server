import { EntityManager, EntityName, Loaded, rel, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { EmailEntity } from './email.entity.js';

export function mapAggregateToData(emailAddress: EmailAddress): RequiredEntityData<EmailAddressEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        email: rel(EmailEntity, emailAddress.emailId),
        address: emailAddress.address,
        enabled: emailAddress.enabled,
    };
}

function mapEntityToAggregate(entity: EmailAddressEntity): EmailAddress {
    return new EmailAddress(entity.email.id, entity.address, entity.enabled);
}

@Injectable()
export class EmailAddressRepo {
    public constructor(private readonly em: EntityManager) {}

    public get entityName(): EntityName<EmailAddressEntity> {
        return EmailAddressEntity;
    }

    public async save(emailAddress: EmailAddress): Promise<EmailAddress> {
        if (emailAddress.emailId) {
            return this.update(emailAddress);
        } else {
            return this.create(emailAddress);
        }
    }

    private async create(emailAddress: EmailAddress): Promise<EmailAddress> {
        const emailAddressEntity: EmailAddressEntity = this.em.create(
            EmailAddressEntity,
            mapAggregateToData(emailAddress),
        );
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntityToAggregate(emailAddressEntity);
    }

    public async update(emailAddress: EmailAddress): Promise<EmailAddress> {
        const emailAddressEntity: Loaded<EmailAddressEntity> = await this.em.findOneOrFail(EmailAddressEntity, {
            address: emailAddress.address,
        });
        emailAddressEntity.assign(mapAggregateToData(emailAddress), {});

        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntityToAggregate(emailAddressEntity);
    }
}
