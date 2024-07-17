import { EntityManager, RequiredEntityData, rel } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/index.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';

function mapAggregateToData(emailAddress: EmailAddress<boolean>): RequiredEntityData<EmailAddressEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailAddress.id,
        personId: rel(PersonEntity, emailAddress.personId),
        address: emailAddress.address,
        enabled: emailAddress.enabled,
    };
}

function mapEntityToAggregate(entity: EmailAddressEntity): EmailAddress<boolean> {
    return new EmailAddress(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId.id,
        entity.address,
        entity.enabled,
    );
}

@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async findByPerson(personId: PersonID): Promise<Option<EmailAddress<true>>> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            {
                $and: [{ personId: { $eq: personId } }, { enabled: { $eq: true } }],
            },
            {},
        );
        if (!emailAddressEntity) return undefined;

        return mapEntityToAggregate(emailAddressEntity);
    }

    public async existsEmailAddress(address: string): Promise<boolean> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            { address: address },
            {},
        );

        return !!emailAddressEntity;
    }

    public async deactivateEmailAddress(emailAddress: string): Promise<EmailAddressEntity | EmailAddressNotFoundError> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            { address: emailAddress },
            {},
        );
        if (!emailAddressEntity) return new EmailAddressNotFoundError(emailAddress);

        emailAddressEntity.enabled = false;
        await this.em.persistAndFlush(emailAddressEntity);

        return emailAddressEntity;
    }

    public async save(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        if (emailAddress.id) {
            return this.update(emailAddress);
        } else {
            return this.create(emailAddress);
        }
    }

    private async create(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        //persist the emailAddress
        const emailAddressEntity: EmailAddressEntity = this.em.create(
            EmailAddressEntity,
            mapAggregateToData(emailAddress),
        );
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntityToAggregate(emailAddressEntity);
    }

    private async update(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        //update the emailAddress
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(EmailAddressEntity, {
            id: emailAddress.id,
        });

        if (emailAddressEntity) {
            emailAddressEntity.assign(mapAggregateToData(emailAddress), {});
            await this.em.persistAndFlush(emailAddressEntity);
        } else {
            this.logger.error(`Email-address:${emailAddress.currentAddress} could not be found`);
            return new EmailAddressNotFoundError(emailAddress.address);
        }

        return mapEntityToAggregate(emailAddressEntity);
    }
}
