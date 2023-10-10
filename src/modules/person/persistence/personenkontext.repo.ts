import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Loaded } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonEntity } from './person.entity.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';

@Injectable()
export class PersonenkontextRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async save(personenkontextDo: PersonenkontextDo<boolean>): Promise<Option<PersonenkontextDo<true>>> {
        if (personenkontextDo.id) {
            return this.update(personenkontextDo);
        }
        return this.create(personenkontextDo);
    }

    private async create(personenkontextDo: PersonenkontextDo<false>): Promise<Option<PersonenkontextDo<true>>> {
        const personenkontext: PersonenkontextEntity = this.mapper.map(
            personenkontextDo,
            PersonenkontextDo,
            PersonenkontextEntity,
        );
        personenkontext.person = this.em.getReference(PersonEntity, personenkontextDo.personId);
        await this.em.persistAndFlush(personenkontext);

        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }

    private async update(personenkontextDo: PersonenkontextDo<true>): Promise<Option<PersonenkontextDo<true>>> {
        let personenkontext: Option<Loaded<PersonenkontextEntity, never>> = await this.em.findOne(
            PersonenkontextEntity,
            {
                id: personenkontextDo.id,
            },
        );
        if (personenkontext) {
            personenkontext.assign(this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity));
            personenkontext.person = this.em.getReference(PersonEntity, personenkontextDo.personId);
        } else {
            personenkontext = this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity);
            personenkontext.person = this.em.getReference(PersonEntity, personenkontextDo.personId);
        }

        await this.em.persistAndFlush(personenkontext);

        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }
}
