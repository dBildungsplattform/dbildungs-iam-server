import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from './person.entity.js';

@Injectable()
export class PersonRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async findById(id: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { id });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    public async findByReferrer(referrer: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { referrer });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }

    public async save(personDo: PersonDo<false>): Promise<PersonDo<true>> {
        const person: PersonEntity = this.mapper.map(personDo, PersonDo<false>, PersonEntity);
        await this.em.persistAndFlush(person);
        return this.mapper.map(person, PersonEntity, PersonDo);
    }

    public async delete(personDo: PersonDo<true>): Promise<void> {
        const person: PersonEntity = this.mapper.map(personDo, PersonDo, PersonEntity);
        await this.em.removeAndFlush(person);
    }
}
