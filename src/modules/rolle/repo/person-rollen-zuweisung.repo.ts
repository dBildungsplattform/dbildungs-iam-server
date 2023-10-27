import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonRollenZuweisungEntity } from '../entity/person-rollen-zuweisung.entity.js';
import { PersonRollenZuweisungDo } from '../domain/person-rollen-zuweisung.do.js';

@Injectable()
export class PersonRollenZuweisungRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async findAllByPersonId(personId: string): Promise<PersonRollenZuweisungDo<true>[]> {
        const query: Record<string, unknown> = {};
        query['person'] = { $ilike: personId };
        const result: PersonRollenZuweisungEntity[] = await this.em.find(PersonRollenZuweisungEntity, query, {
            populate: ['rolle'],
        });
        return result.map((personRollenZuweisung: PersonRollenZuweisungEntity) =>
            this.mapper.map(personRollenZuweisung, PersonRollenZuweisungEntity, PersonRollenZuweisungDo),
        );
    }
}
