import { Collection, EntityData, EntityManager, EntityName, Loaded, rel, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailEntity } from './email.entity.js';
import { Email } from '../domain/email.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { EmailID, PersonID } from '../../../shared/types/index.js';
import { EmailGeneratorService } from '../domain/email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';

export function mapEmailAddressAggregateToData(
    emailAddress: EmailAddress<boolean>,
    emailId: EmailID,
): RequiredEntityData<EmailAddressEntity> {
    return {
        email: emailId,
        address: emailAddress.address,
        enabled: emailAddress.enabled,
    };
}

export function mapAggregateToData(email: Email<boolean, true>): RequiredEntityData<EmailEntity> {
    const emailAddresses: EntityData<EmailAddressEntity>[] = email.emailAddresses.map(
        (emailAddress: EmailAddress<boolean>) => {
            return {
                email: email.id,
                address: emailAddress.address,
                enabled: emailAddress.enabled,
            };
        },
    );

    return {
        personId: rel(PersonEntity, email.personId),
        emailAddresses: new Collection<EmailAddressEntity>(emailAddresses),
    };
}

export function mapEntityToAggregate(
    entity: EmailEntity,
    emailGeneratorService: EmailGeneratorService,
    personRepository: PersonRepository,
): Email<true, true> {
    const emailAddresses: EmailAddress<boolean>[] = entity.emailAddresses.map(
        (emailAddressEntity: EmailAddressEntity) => {
            return new EmailAddress(entity.id, emailAddressEntity.address, emailAddressEntity.enabled);
        },
    );

    return Email.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId.id,
        emailAddresses,
        emailGeneratorService,
        personRepository,
    );
}
@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly emailGeneratorService: EmailGeneratorService,
        private readonly personRepository: PersonRepository,
    ) {}

    public get entityName(): EntityName<EmailEntity> {
        return EmailEntity;
    }

    public async findById(id: EmailID): Promise<Option<Email<true, true>>> {
        const emailEntity: Option<EmailEntity> = await this.em.findOne(this.entityName, { id }, {});

        return emailEntity && mapEntityToAggregate(emailEntity, this.emailGeneratorService, this.personRepository);
    }

    public async findByPerson(personId: PersonID): Promise<Email<true, true>> {
        const emailEntity: Loaded<EmailEntity> = await this.em.findOneOrFail(
            EmailEntity,
            { personId },
            { populate: ['emailAddresses'] as const },
        );

        return emailEntity && mapEntityToAggregate(emailEntity, this.emailGeneratorService, this.personRepository);
    }

    public async save(email: Email<boolean, true>): Promise<Email<true, true>> {
        if (email.id) {
            return this.update(email);
        } else {
            return this.create(email);
        }
    }

    private async create(email: Email<false, true>): Promise<Email<true, true>> {
        const emailEntity: EmailEntity = this.em.create(EmailEntity, mapAggregateToData(email));
        await this.em.persistAndFlush(emailEntity);

        //persist the emailAddresses
        for (const emailAddress of email.emailAddresses) {
            const emailAddressEntity: EmailAddressEntity = this.em.create(
                EmailAddressEntity,
                mapEmailAddressAggregateToData(emailAddress, emailEntity.id),
            );
            await this.em.persistAndFlush(emailAddressEntity);
        }

        return mapEntityToAggregate(emailEntity, this.emailGeneratorService, this.personRepository);
    }

    private async update(email: Email<true, true>): Promise<Email<true, true>> {
        const emailEntity: Loaded<EmailEntity> = await this.em.findOneOrFail(EmailEntity, email.id, {
            populate: ['emailAddresses'] as const,
        });

        emailEntity.assign(mapAggregateToData(email), { updateNestedEntities: true });

        await this.em.persistAndFlush(emailEntity);

        return mapEntityToAggregate(emailEntity, this.emailGeneratorService, this.personRepository);
    }

    public async deleteById(id: EmailID): Promise<boolean> {
        const emailEntity: Option<EmailEntity> = await this.em.findOne(EmailEntity, { id });
        if (emailEntity) {
            await this.em.removeAndFlush(emailEntity);
            return true;
        }
        return false;
    }
}
