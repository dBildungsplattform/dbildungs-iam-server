import { EntityManager, RequiredEntityData, rel } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Email } from '../domain/email.js';
import { PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from '../domain/email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';

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

function mapEntitiesToEmailAggregate(
    personId: PersonID,
    entities: EmailAddressEntity[],
    emailGeneratorService: EmailGeneratorService,
    personRepository: PersonRepository,
): Email<true> {
    const emailAddresses: EmailAddress<boolean>[] = entities.map((entity: EmailAddressEntity) =>
        mapEntityToAggregate(entity),
    );

    return Email.construct(personId, emailGeneratorService, personRepository, emailAddresses);
}

@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
        private readonly emailGeneratorService: EmailGeneratorService,
        private readonly personRepository: PersonRepository,
    ) {}

    public async findByPerson(personId: PersonID): Promise<Option<Email<true>>> {
        const emailAddressEntities: EmailAddressEntity[] = await this.em.find(EmailAddressEntity, { personId }, {});

        return mapEntitiesToEmailAggregate(
            personId,
            emailAddressEntities,
            this.emailGeneratorService,
            this.personRepository,
        );
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

    public async save(email: Email<boolean>): Promise<Email<true> | DomainError> {
        this.logger.info('save email');
        if (!email.emailAddresses) {
            return new EmailInvalidError(['No email-addresses attached to email aggregate']);
        }

        if (email.emailAddresses.some((emailAddress: EmailAddress<boolean>) => emailAddress.id)) {
            return this.update(email.personId, email.emailAddresses);
        } else {
            return this.create(email.personId, email.emailAddresses);
        }
    }

    private async create(
        personId: PersonID,
        emailAddresses: EmailAddress<boolean>[],
    ): Promise<Email<true> | DomainError> {
        //persist the emailAddresses
        const emailAddressEntities: EmailAddressEntity[] = [];
        for (const emailAddress of emailAddresses) {
            const emailAddressEntity: EmailAddressEntity = this.em.create(
                EmailAddressEntity,
                mapAggregateToData(emailAddress),
            );
            emailAddressEntities.push(emailAddressEntity);
            await this.em.persistAndFlush(emailAddressEntity);
        }

        return mapEntitiesToEmailAggregate(
            personId,
            emailAddressEntities,
            this.emailGeneratorService,
            this.personRepository,
        );
    }

    private async update(
        personId: PersonID,
        emailAddresses: EmailAddress<boolean>[],
    ): Promise<Email<true> | DomainError> {
        //update the emailAddresses
        const emailAddressEntities: EmailAddressEntity[] = [];
        for (const emailAddress of emailAddresses) {
            const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(EmailAddressEntity, {
                address: emailAddress.address,
            });

            if (emailAddressEntity) {
                emailAddressEntity.assign(mapAggregateToData(emailAddress), {});
                emailAddressEntities.push(emailAddressEntity);
                await this.em.persistAndFlush(emailAddressEntity);
            } else {
                this.logger.error(`Email-address:${emailAddress.address} could not be found`);
                return new EmailAddressNotFoundError(emailAddress.address);
            }
        }

        return mapEntitiesToEmailAggregate(
            personId,
            emailAddressEntities,
            this.emailGeneratorService,
            this.personRepository,
        );
    }
}
