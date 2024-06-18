import { EntityManager, EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailEntity } from './email.entity.js';
import { Email } from '../domain/email.js';

export function mapEntityToAggregate(entity: EmailEntity): Email<true> {
    return Email.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.enabled,
        entity.personId.id,
    );
}
/*
    This repo is used to avoid a circle in the relationship EmailGeneratorService <-> EmailRepo.
 */
@Injectable()
export class EmailServiceRepo {
    public constructor(protected readonly em: EntityManager) {}

    public get entityName(): EntityName<EmailEntity> {
        return EmailEntity;
    }

    public async findByName(name: string): Promise<Option<Email<true>>> {
        const email: Option<EmailEntity> = await this.em.findOne(this.entityName, { name }, {});

        return email && mapEntityToAggregate(email);
    }
}
