import { EntityManager, QueryOrder, ref, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PersonID } from '../../../shared/types/index.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { PersonAlreadyHasEnabledEmailAddressError } from '../error/person-already-has-enabled-email-address.error.js';
import { Person } from '../../person/domain/person.js';
import { PersonEmailResponse } from '../../person/api/person-email-response.js';

export function mapAggregateToData(emailAddress: EmailAddress<boolean>): RequiredEntityData<EmailAddressEntity> {
    const oxUserIdStr: string | undefined = emailAddress.oxUserID ? emailAddress.oxUserID + '' : undefined;
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailAddress.id,
        personId: ref(PersonEntity, emailAddress.personId),
        address: emailAddress.address,
        oxUserId: oxUserIdStr,
        status: emailAddress.status,
    };
}

function mapEntityToAggregate(entity: EmailAddressEntity): EmailAddress<boolean> {
    return new EmailAddress(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId.id,
        entity.address,
        entity.status,
        entity.oxUserId,
    );
}

@Injectable()
export class EmailRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async findEnabledByPerson(personId: PersonID): Promise<Option<EmailAddress<true>>> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            {
                personId: { $eq: personId },
                status: { $eq: EmailAddressStatus.ENABLED },
            },
            {},
        );
        if (!emailAddressEntity) return undefined;

        return mapEntityToAggregate(emailAddressEntity);
    }

    /**
     * Will return the most recently updated EmailAddress if multiple EmailAddresses with REQUESTED status can be found for personId, warning will be logged in this case.
     * @param personId
     */
    public async findRequestedByPerson(personId: PersonID): Promise<Option<EmailAddress<true>>> {
        const emailAddresses: EmailAddress<true>[] = await this.findByPersonSortedByUpdatedAtDesc(
            personId,
            EmailAddressStatus.REQUESTED,
        );

        if (!emailAddresses || !emailAddresses[0]) return null;

        if (emailAddresses.length > 1) {
            this.logger.warning(`Multiple EmailAddresses Found In REQUESTED Status For personId:${personId}`);
            this.logger.info(
                `Only Most Recently Updated EmailAddresses Will Be Returned, address: ${emailAddresses[0].address}, personId:${personId}`,
            );
        }

        return emailAddresses[0];
    }

    public async findByPersonSortedByUpdatedAtDesc(
        personId: PersonID,
        status?: EmailAddressStatus,
    ): Promise<EmailAddress<true>[]> {
        const emailAddressEntities: EmailAddressEntity[] = await this.em.find(
            EmailAddressEntity,
            {
                personId: { $eq: personId },
            },
            { orderBy: { updatedAt: QueryOrder.DESC } },
        );

        let emails: EmailAddress<true>[] = emailAddressEntities.map(mapEntityToAggregate);

        if (status) {
            emails = emails.filter((ea: EmailAddress<true>) => ea.status === status);
        }

        return emails;
    }

    public async findByAddress(address: string): Promise<Option<EmailAddress<true>>> {
        const emailAddressEntity: Option<EmailAddressEntity> = await this.em.findOne(
            EmailAddressEntity,
            {
                address: { $eq: address },
            },
            { orderBy: { updatedAt: QueryOrder.DESC } },
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

        emailAddressEntity.status = EmailAddressStatus.DISABLED;
        await this.em.persistAndFlush(emailAddressEntity);

        return emailAddressEntity;
    }

    public async getEmailAddressAndStatusForPerson(person: Person<true>): Promise<PersonEmailResponse | undefined> {
        const enabledEmailAddress: Option<EmailAddress<true>> = await this.findEnabledByPerson(person.id);
        if (enabledEmailAddress) {
            return new PersonEmailResponse(enabledEmailAddress.status, enabledEmailAddress.address);
        }
        const emailAddresses: Option<EmailAddress<true>[]> = await this.findByPersonSortedByUpdatedAtDesc(person.id);
        if (!emailAddresses || !emailAddresses[0]) return undefined;

        return new PersonEmailResponse(emailAddresses[0].status, emailAddresses[0].address);
    }

    /**
     * Creates or updates entity in database. If the emailAddress parameter has status enabled or requested
     * and the referenced person already has an enabled email-address, PersonAlreadyHasEnabledEmailAddressError is returned.
     * @param emailAddress
     */
    public async save(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        if (emailAddress.enabledOrRequested) {
            const enabledEmailAddressExists: Option<EmailAddress<true>> = await this.findEnabledByPerson(
                emailAddress.personId,
            );
            if (enabledEmailAddressExists)
                return new PersonAlreadyHasEnabledEmailAddressError(emailAddress.personId, emailAddress.address);
        }
        if (emailAddress.id) {
            return this.update(emailAddress);
        } else {
            return this.create(emailAddress);
        }
    }

    private async create(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        const emailAddressEntity: EmailAddressEntity = this.em.create(
            EmailAddressEntity,
            mapAggregateToData(emailAddress),
        );
        await this.em.persistAndFlush(emailAddressEntity);

        return mapEntityToAggregate(emailAddressEntity);
    }

    private async update(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
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
