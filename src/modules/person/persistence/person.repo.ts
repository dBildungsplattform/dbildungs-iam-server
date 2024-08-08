import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from './person.entity.js';
import { EntityName } from '@mikro-orm/core';
/**
 * @deprecated This class is only used in a depricated Post request
 */
@Injectable()
export class PersonRepo {
    public constructor(
        private readonly em: EntityManager,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    public async findById(id: string): Promise<Option<PersonDo<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { id });
        if (person) {
            return this.mapper.map(person, PersonEntity, PersonDo);
        }
        return null;
    }
}
