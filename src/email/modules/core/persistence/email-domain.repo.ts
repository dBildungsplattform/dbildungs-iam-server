import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailDomainEntity } from './email-domain.entity.js';
import { EmailDomain } from '../domain/aggregates/email-domain.js';
import { DomainError } from '../../../../shared/error/index.js';
import { EmailDomainNotFoundError } from '../error/email-domain-not-found.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';

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
    public constructor(
        private readonly em: EntityManager,
        private readonly logger: ClassLogger,
    ) {}

    public async findById(emailDomainId: string): Promise<Option<EmailDomain<true>>> {
        const emailDomainEntity: Option<EmailDomainEntity> = await this.em.findOne(EmailDomainEntity, {
            id: { $eq: emailDomainId },
        });

        if (emailDomainEntity) {
            return mapEntityToAggregate(emailDomainEntity);
        }

        return null;
    }

    public async save(emailDomain: EmailDomain<boolean>): Promise<EmailDomain<true> | DomainError> {
        if (emailDomain.id) {
            return this.update(emailDomain);
        } else {
            return this.create(emailDomain);
        }
    }

    //Public to allow seeding to create entity with fixed Id
    public async create(emailDomain: EmailDomain<boolean>): Promise<EmailDomain<true>> {
        const emailDomainEntity: EmailDomainEntity = this.em.create(EmailDomainEntity, mapAggregateToData(emailDomain));
        await this.em.persistAndFlush(emailDomainEntity);

        return mapEntityToAggregate(emailDomainEntity);
    }

    private async update(emailDomain: EmailDomain<boolean>): Promise<EmailDomain<true> | DomainError> {
        const emailDomainEntity: Option<EmailDomainEntity> = await this.em.findOne(EmailDomainEntity, {
            id: emailDomain.id,
        });

        if (emailDomainEntity) {
            emailDomainEntity.assign(mapAggregateToData(emailDomain), {});
            await this.em.persistAndFlush(emailDomainEntity);
        } else {
            this.logger.error(`Email-Domain:${emailDomain.domain} with id ${emailDomain.id} could not be found`);
            return new EmailDomainNotFoundError(emailDomain.domain);
        }

        return mapEntityToAggregate(emailDomainEntity);
    }
}
