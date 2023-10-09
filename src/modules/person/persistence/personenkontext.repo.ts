import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Loaded } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { PersonenkontextAlreadyExistsError } from '../../../shared/error/personenkontext-already-exists.error.js';

@Injectable()
export class PersonenkontextRepo {
    public constructor(private readonly em: EntityManager, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    public async save(personenkontextDo: PersonenkontextDo<boolean>): Promise<PersonenkontextDo<true>> {
        if (personenkontextDo.id) {
            return this.update(personenkontextDo);
        }
        return this.create(personenkontextDo);
    }

    private async create(personenkontextDo: PersonenkontextDo<false>): Promise<PersonenkontextDo<true>> {
        const personenkontext: PersonenkontextEntity = this.mapper.map(
            personenkontextDo,
            PersonenkontextDo,
            PersonenkontextEntity,
        );
        const person: Option<Loaded<PersonEntity, never>> = await this.em.findOne(PersonEntity, {
            id: personenkontextDo.personId,
        });
        if (person) {
            personenkontext.person = person;
        } else {
            throw new EntityNotFoundError('Person');
        }

        const existing: Option<Loaded<PersonenkontextEntity, never>> = await this.em.findOne(PersonenkontextEntity, {
            jahrgangsstufe: personenkontext.jahrgangsstufe ? personenkontext.jahrgangsstufe : null,
            referrer: personenkontext.referrer ? personenkontext.referrer : null,
            rolle: personenkontext.rolle,
            personenstatus: personenkontext.personenstatus ? personenkontext.personenstatus : null,
            person: personenkontext.person,
        });

        if (existing) {
            throw new PersonenkontextAlreadyExistsError('Personenkontext with identical data already exists');
        }

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
            const person: Option<Loaded<PersonEntity, never>> = await this.em.findOne(PersonEntity, {
                id: personenkontextDo.personId,
            });
            if (person) {
                personenkontext.person = person;
            } else {
                throw new EntityNotFoundError('Person');
            }
        } else {
            personenkontext = this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity);
            const person: Option<Loaded<PersonEntity, never>> = await this.em.findOne(PersonEntity, {
                id: personenkontextDo.personId,
            });
            if (person) {
                personenkontext.person = person;
            } else {
                throw new EntityNotFoundError('Person');
            }
        }
        await this.em.persistAndFlush(personenkontext);
        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }
}
