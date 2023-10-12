import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonRollenZuweisungEntity } from './person-rollen-zuweisung.entity.js';
import { PersonRollenZuweisungDo } from '../domain/person-rollen-zuweisung.do.js';
import { PersonDo } from '../../person/domain/person.do.js';

@Injectable()
export class PersonRollenZuweisungRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    /*  public async findById(id: string): Promise<Option<PersonDo<true>>> {
        const personRollenZuweisung: Option<PersonRollenZuweisungEntity> = await this.em.findOne(PersonRollenZuweisungEntity, { id });
        if (personRollenZuweisung) {
            return this.mapper.map(personRollenZuweisung, PersonRollenZuweisungEntity, PersonRollenZuweisungDo);
        }
        return null;
    }*/

    public async findAll(personDo: PersonDo<false>): Promise<PersonRollenZuweisungDo<true>[]> {
        const query: Record<string, unknown> = {};
        if (personDo.id) {
            query['person'] = { $ilike: personDo.id };
        }
        const result: PersonRollenZuweisungEntity[] = await this.em.find(PersonRollenZuweisungEntity, query);
        return result.map((personRollenZuweisung: PersonRollenZuweisungEntity) =>
            this.mapper.map(personRollenZuweisung, PersonRollenZuweisungEntity, PersonRollenZuweisungDo),
        );
    }

    public async findAllByPersonId(personId: string): Promise<PersonRollenZuweisungDo<true>[]> {
        const query: Record<string, unknown> = {};
        query['person'] = { $ilike: personId };
        const result: PersonRollenZuweisungEntity[] = await this.em.find(PersonRollenZuweisungEntity, query, {
            populate: ['role'],
        });
        return result.map((personRollenZuweisung: PersonRollenZuweisungEntity) =>
            this.mapper.map(personRollenZuweisung, PersonRollenZuweisungEntity, PersonRollenZuweisungDo),
        );
    }
}
