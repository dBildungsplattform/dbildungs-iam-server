import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from './person.entity.js';
import { EntityName, Loaded } from '@mikro-orm/core';
import { PersonScope } from './person.scope.js';

@Injectable()
export class PersonRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public async findBy(scope: PersonScope): Promise<Counted<PersonDo<true>>> {
        const [entities, total]: Counted<PersonEntity> = await scope.executeQuery(this.em);
        const dos: PersonDo<true>[] = entities.map((entity: PersonEntity) =>
            this.mapper.map(entity, PersonEntity, PersonDo),
        );

        return [dos, total];
    }

    public async findById(id: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { id });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    public async findByReferrer(referrer: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { referrer });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    public async findByKeycloakUserId(keycloakUserId: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { keycloakUserId });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    public async save(personDo: PersonDo<boolean>): Promise<PersonDo<true>> {
        if (personDo.id) {
            return this.update(personDo);
        }
        return this.create(personDo);
    }

    public async deleteById(id: string): Promise<Option<PersonDo<false>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { id });
        if (person) {
            await this.em.removeAndFlush(person);
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    private async create(personDo: PersonDo<false>): Promise<PersonDo<true>> {
        const person: PersonEntity = this.mapper.map(personDo, PersonDo, PersonEntity);
        await this.em.persistAndFlush(person);
        return this.mapper.map(person, PersonEntity, PersonDo);
    }

    private async update(personDo: PersonDo<true>): Promise<PersonDo<true>> {
        let person: Option<Loaded<PersonEntity, never>> = await this.em.findOne(this.entityName, { id: personDo.id });
        if (person) {
            person.assign(this.mapper.map(personDo, PersonDo, PersonEntity));
        } else {
            person = this.mapper.map(personDo, PersonDo, PersonEntity);
        }
        await this.em.persistAndFlush(person);
        return this.mapper.map(person, PersonEntity, PersonDo);
    }
}
