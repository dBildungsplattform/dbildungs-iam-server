import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Loaded } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';

@Injectable()
export class PersonenkontextRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    private async create(personenkontextDo: PersonenkontextDo<false>): Promise<PersonenkontextDo<true>> {
        const personenkontext: PersonenkontextEntity = this.mapper.map(
            personenkontextDo,
            PersonenkontextDo,
            PersonenkontextEntity,
        );
        personenkontext.person = await this.em.findOneOrFail(PersonEntity, {
            id: personenkontextDo.personId,
        });

        // TODO check if personenkontext with identical data already exists

        await this.em.persistAndFlush(personenkontext);

        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }

    private async update(personenkontextDo: PersonenkontextDo<true>): Promise<PersonenkontextDo<true>> {
        let personenkontext: Option<Loaded<PersonenkontextEntity, never>> = await this.em.findOne(
            PersonenkontextEntity,
            {
                id: personenkontextDo.id,
            },
        );
        if (personenkontext) {
            personenkontext.assign(this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity));
        } else {
            personenkontext = this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity);
        }
        await this.em.persistAndFlush(personenkontext);
        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }

    public async save(personenkontextDo: PersonenkontextDo<boolean>): Promise<PersonenkontextDo<true>> {
        if (personenkontextDo.id) {
            return this.update(personenkontextDo);
        }
        return this.create(personenkontextDo);
    }
}
