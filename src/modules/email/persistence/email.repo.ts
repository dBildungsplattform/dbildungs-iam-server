import { EntityManager, EntityName, Loaded, rel, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EmailEntity } from './email.entity.js';
import { Email } from '../domain/email.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { PersonID } from '../../../shared/types/index.js';

export function mapAggregateToData(email: Email<boolean>): RequiredEntityData<EmailEntity> {
    return {
        id: email.id,
        name: email.name,
        enabled: email.enabled,
        personId: rel(PersonEntity, email.personId),
    };
}

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
@Injectable()
export class EmailRepo {
    public constructor(protected readonly em: EntityManager) {}

    public get entityName(): EntityName<EmailEntity> {
        return EmailEntity;
    }

    public async findById(id: string): Promise<Option<Email<true>>> {
        const email: Option<EmailEntity> = await this.em.findOne(this.entityName, { id }, {});

        return email && mapEntityToAggregate(email);
    }

    public async findByIds(ids: string[]): Promise<Map<string, Email<true>>> {
        const emailEntities: EmailEntity[] = await this.em.find(EmailEntity, { id: { $in: ids } }, {});

        const emailMap: Map<string, Email<true>> = new Map();
        emailEntities.forEach((emailEntity: EmailEntity) => {
            const email: Email<true> = mapEntityToAggregate(emailEntity);
            emailMap.set(emailEntity.id, email);
        });

        return emailMap;
    }

    public async findByName(name: string): Promise<Option<Email<true>>> {
        const email: Option<EmailEntity> = await this.em.findOne(this.entityName, { name }, {});

        return email && mapEntityToAggregate(email);
    }

    public async findByPersonId(personId: PersonID): Promise<Email<true>[]> {
        const emailEntities: EmailEntity[] = await this.em.find(this.entityName, { personId }, {});

        return emailEntities.map((entity: EmailEntity) => mapEntityToAggregate(entity));
    }

    public async save(email: Email<boolean>): Promise<Email<true>> {
        if (email.id) {
            return this.update(email);
        } else {
            return this.create(email);
        }
    }

    private async create(email: Email<false>): Promise<Email<true>> {
        const emailEntity: EmailEntity = this.em.create(EmailEntity, mapAggregateToData(email));

        await this.em.persistAndFlush(emailEntity);

        return mapEntityToAggregate(emailEntity);
    }

    private async update(email: Email<true>): Promise<Email<true>> {
        const emailEntity: Loaded<EmailEntity> = await this.em.findOneOrFail(EmailEntity, email.id, {});
        emailEntity.assign(mapAggregateToData(email), { updateNestedEntities: true });

        await this.em.persistAndFlush(emailEntity);

        return mapEntityToAggregate(emailEntity);
    }
}
