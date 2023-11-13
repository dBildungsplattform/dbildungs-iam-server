import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Loaded } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';

@Injectable()
export class PersonenkontextRepo {
    public constructor(
        private readonly em: EntityManager,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async save(personenkontextDo: PersonenkontextDo<boolean>): Promise<Option<PersonenkontextDo<true>>> {
        if (personenkontextDo.id) {
            return this.update(personenkontextDo);
        }
        return this.create(personenkontextDo);
    }

    // TODO refactor after EW-561 is done, use Scope
    public async findAll(personenkontextDo: PersonenkontextDo<false>): Promise<PersonenkontextDo<true>[]> {
        const query: Record<string, unknown> = {};

        query['personId'] = personenkontextDo.personId;

        if (personenkontextDo.referrer) {
            query['referrer'] = personenkontextDo.referrer;
        }

        if (personenkontextDo.rolle) {
            query['rolle'] = personenkontextDo.rolle;
        }

        if (personenkontextDo.personenstatus) {
            query['personenstatus'] = personenkontextDo.personenstatus;
        }

        if (personenkontextDo.sichtfreigabe !== undefined) {
            query['sichtfreigabe'] = personenkontextDo.sichtfreigabe;
        }

        const result: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, query);
        return result.map((person: PersonenkontextEntity) =>
            this.mapper.map(person, PersonenkontextEntity, PersonenkontextDo),
        );
    }

    public async findById(id: string): Promise<Option<PersonenkontextDo<true>>> {
        const entity: Option<Loaded<PersonenkontextEntity>> = await this.em.findOne(PersonenkontextEntity, { id });
        const result: Option<PersonenkontextDo<true>> = entity
            ? this.mapper.map(entity, PersonenkontextEntity, PersonenkontextDo)
            : null;

        return result;
    }

    private async create(personenkontextDo: PersonenkontextDo<false>): Promise<Option<PersonenkontextDo<true>>> {
        const personenkontext: PersonenkontextEntity = this.mapper.map(
            personenkontextDo,
            PersonenkontextDo,
            PersonenkontextEntity,
        );

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
        } else {
            personenkontext = this.mapper.map(personenkontextDo, PersonenkontextDo, PersonenkontextEntity);
        }

        await this.em.persistAndFlush(personenkontext);

        return this.mapper.map(personenkontext, PersonenkontextEntity, PersonenkontextDo);
    }
}
