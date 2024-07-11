import { EntityManager, RequiredEntityData, rel } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/index.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { Email } from '../domain/email.js';

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

function mapEntitiesToEmailAggregate(personId: PersonID, entity: EmailAddressEntity): Email {
    return Email.construct(personId, mapEntityToAggregate(entity));
}

@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async findByPerson(personId: PersonID): Promise<Option<Email>> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            {
                $and: [{ personId: { $eq: personId } }, { enabled: { $eq: true } }],
            },
            {},
        );
        if (!emailAddressEntity) return undefined;

        return mapEntitiesToEmailAggregate(personId, emailAddressEntity);
    }

    public async existsEmailAddress(address: string): Promise<boolean> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            { address: address },
            {},
        );

        return !!emailAddressEntity;
    }

    // This method in principle should be located in email.repo. It is here to avoid a circular reference.
    public async findEmailAddressByPerson(personId: PersonID): Promise<string | undefined> {
        const emailAddressEntities: EmailAddressEntity[] = await this.em.find(EmailAddressEntity, { personId }, {});

        for (const emailAddressEntity of emailAddressEntities) {
            if (emailAddressEntity.enabled) return emailAddressEntity.address;
        }
        return undefined;
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

    public async save(email: Email): Promise<Email | DomainError> {
        this.logger.info('save email');
        if (email.emailAddress.id) {
            return this.update(email.personId, email.emailAddress);
        } else {
            return this.create(email.personId, email.emailAddress);
        }
    }

    private async create(personId: PersonID, emailAddress: EmailAddress<boolean>): Promise<Email | DomainError> {
        //persist the emailAddress
        const emailAddressEntity: EmailAddressEntity = this.em.create(
            EmailAddressEntity,
            mapAggregateToData(emailAddress),
        );
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntitiesToEmailAggregate(personId, emailAddressEntity);
    }

    private async update(personId: PersonID, emailAddress: EmailAddress<boolean>): Promise<Email | DomainError> {
        //update the emailAddresses
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(EmailAddressEntity, {
            address: emailAddress.address,
        });

        if (emailAddressEntity) {
            emailAddressEntity.assign(mapAggregateToData(emailAddress), {});
            await this.em.persistAndFlush(emailAddressEntity);
        } else {
            this.logger.error(`Email-address:${emailAddress.address} could not be found`);
            return new EmailAddressNotFoundError(emailAddress.address);
        }

        return mapEntitiesToEmailAggregate(personId, emailAddressEntity);
    }
}
