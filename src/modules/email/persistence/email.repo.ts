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
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { Person } from '../../person/domain/person.js';
import { EmailAddressAmbiguousError } from '../error/email-address-ambiguous.error.js';

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
    entity: EmailAddressEntity,
    emailGeneratorService: EmailGeneratorService,
    personRepository: PersonRepository,
): Email<true> {
    return Email.construct(personId, emailGeneratorService, personRepository, mapEntityToAggregate(entity));
}

@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
        private readonly emailGeneratorService: EmailGeneratorService,
        private readonly personRepository: PersonRepository,
    ) {}

    public async findByPerson(personId: PersonID): Promise<Email<true> | DomainError> {
        const emailAddressEntities: EmailAddressEntity[] = await this.em.find(EmailAddressEntity, { personId }, {});

        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return new EntityNotFoundError('Person');
        }

        const filteredEAs: EmailAddressEntity[] = [];
        for (const eaEntity of emailAddressEntities)
            if (this.emailGeneratorService.isEqual(eaEntity.address, person.vorname, person.familienname)) {
                filteredEAs.push(eaEntity);
            }
        if (filteredEAs.length < 1 || !filteredEAs[0]) {
            return new EmailAddressNotFoundError();
        }
        if (filteredEAs.length > 1) {
            return new EmailAddressAmbiguousError();
        }

        return mapEntitiesToEmailAggregate(personId, filteredEAs[0], this.emailGeneratorService, this.personRepository);
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
        if (!email.emailAddress) {
            return new EmailInvalidError(['No email-addresses attached to email aggregate']);
        }

        if (email.emailAddress.id) {
            return this.update(email.personId, email.emailAddress);
        } else {
            return this.create(email.personId, email.emailAddress);
        }
    }

    private async create(personId: PersonID, emailAddress: EmailAddress<boolean>): Promise<Email<true> | DomainError> {
        //persist the emailAddress
        const emailAddressEntity: EmailAddressEntity = this.em.create(
            EmailAddressEntity,
            mapAggregateToData(emailAddress),
        );
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntitiesToEmailAggregate(
            personId,
            emailAddressEntity,
            this.emailGeneratorService,
            this.personRepository,
        );
    }

    private async update(personId: PersonID, emailAddress: EmailAddress<boolean>): Promise<Email<true> | DomainError> {
        //update the emailAddresses
        const emailAddressEntities: EmailAddressEntity[] = [];
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

        return mapEntitiesToEmailAggregate(
            personId,
            emailAddressEntity,
            this.emailGeneratorService,
            this.personRepository,
        );
    }
}
