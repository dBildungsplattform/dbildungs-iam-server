import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailAddrEntity } from './email-address.entity.js';
import { EmailAddress } from '../domain/email-address.js';
import { DomainError, EntityNotFoundError } from '../../../../shared/error/index.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { mapEntityToAggregate as mapStatusEntityToAggregate } from './email-address-status.repo.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';
import { EmailAddressStatusEntity, EmailAddressStatusEnum } from './email-address-status.entity.js';
import { PersonID } from '../../../../shared/types/aggregate-ids.types.js';
import { Err, Ok } from '../../../../shared/util/result.js';

export function mapAggregateToData(emailAddress: EmailAddress<boolean>): RequiredEntityData<EmailAddrEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: emailAddress.id,
        address: emailAddress.address,
        priority: emailAddress.priority,
        spshPersonId: emailAddress.spshPersonId,
        externalId: emailAddress.externalId,
        oxUserCounter: emailAddress.oxUserCounter,
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
        oxUserCounter: entity.oxUserCounter,
        externalId: entity.externalId,
        markedForCron: entity.markedForCron,
    });
}

function statusSortFn(a: EmailAddressStatusEntity, b: EmailAddressStatusEntity): number {
    return b.createdAt.getTime() - a.createdAt.getTime();
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

    public async findAllEmailAddressesWithStatusesDescBySpshPersonId(
        spshPersonId: string,
    ): Promise<AddressWithStatusesDescDto[]> {
        const emailAddressEntities: EmailAddrEntity[] = await this.em.find(
            EmailAddrEntity,
            { spshPersonId: { $eq: spshPersonId } },
            {
                populate: ['statuses'],
                orderBy: { id: 'asc' },
            },
        );
        return emailAddressEntities.map(
            (entity: EmailAddrEntity) =>
                new AddressWithStatusesDescDto(
                    mapEntityToAggregate(entity),
                    entity.statuses.getItems().sort(statusSortFn).map(mapStatusEntityToAggregate),
                ),
        );
    }

    public async shiftPriorities(
        emailAddress: EmailAddress<true>,
        targetPriority: number,
    ): Promise<Result<EmailAddress<true>[], DomainError>> {
        const emails: EmailAddrEntity[] = await this.em.find(
            EmailAddrEntity,
            {
                spshPersonId: emailAddress.spshPersonId,
            },
            {
                orderBy: { priority: 'asc' },
            },
        );

        const targetEmailAddressIdx: number = emails.findIndex((em: EmailAddrEntity) => em.id === emailAddress.id);

        if (targetEmailAddressIdx < 0) {
            return Err(new EntityNotFoundError('EmailAddress', emailAddress.id));
        }

        // Null assertion is valid because of the check above
        const targetEmailAddress: EmailAddrEntity = emails.splice(targetEmailAddressIdx, 1)[0]!;

        // Shift all emails that need to be moved
        let priorityToMove: number = targetPriority;
        for (const em of emails) {
            if (em.priority === priorityToMove) {
                em.priority += 1;
                priorityToMove += 1;
            }
        }

        targetEmailAddress.priority = targetPriority;

        await this.em.flush();

        return Ok([targetEmailAddress, ...emails].map(mapEntityToAggregate));
    }

    public async ensureStatusesAndCronDateForPerson(
        spshPersonId: PersonID,
        cronDate: Date,
    ): Promise<EmailAddress<true>[]> {
        const emails: EmailAddrEntity[] = await this.em.find(
            EmailAddrEntity,
            {
                spshPersonId,
            },
            { populate: ['statuses'] },
        );

        for (const email of emails) {
            // Ensure the primary email has no cron date
            if (email.priority === 0) {
                email.markedForCron = undefined;
            }

            // Ensure all emails with priority 1 or higher have a cron date
            if (email.priority >= 1) {
                email.markedForCron ??= cronDate;
            }

            // Ensure there are no emails with priority 2 or higher with status "ACTIVE"
            if (email.priority >= 2) {
                const newestStatus: EmailAddressStatusEntity | undefined = email.statuses
                    .getItems()
                    .sort(statusSortFn)[0];

                if (!newestStatus || newestStatus.status === EmailAddressStatusEnum.ACTIVE) {
                    email.statuses.add(
                        this.em.create(EmailAddressStatusEntity, {
                            emailAddress: email,
                            status: EmailAddressStatusEnum.DEACTIVE,
                        }),
                    );
                }
            }
        }

        await this.em.flush();

        return emails.map(mapEntityToAggregate);
    }

    public async save(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true> | DomainError> {
        if (emailAddress.id) {
            return this.update(emailAddress);
        } else {
            return this.create(emailAddress);
        }
    }

    private async create(emailAddress: EmailAddress<boolean>): Promise<EmailAddress<true>> {
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
