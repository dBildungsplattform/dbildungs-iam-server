/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from './person.entity.js';
import { Loaded, QueryOrderMap } from '@mikro-orm/core';
import { IFindOptions, IPagination, SortOrder } from '../../../shared/interface/find-options.js';
import { Page } from '../../../shared/interface/page.js';
import { Scope } from '../../../shared/repo/scope.js';
import { PersonScope } from './person.scope.js';
import { PersonSortingMapper } from './person-sorting.mapper.js';
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
        let person: Option<Loaded<PersonEntity, never>> = await this.em.findOne(PersonEntity, { id: personDo.id });
        if (person) {
            person.assign(this.mapper.map(personDo, PersonDo, PersonEntity));
        } else {
            person = this.mapper.map(personDo, PersonDo, PersonEntity);
        }
        await this.em.persistAndFlush(person);
        return this.mapper.map(person, PersonEntity, PersonDo);
    }

    public async findAll(
        personDo: PersonDo<false>,
        options?: IFindOptions<PersonDo<true>[]>,
    ): Promise<PersonDo<true>[]> {
        const pagination: IPagination = options?.pagination || {};
        const order: QueryOrderMap<PersonEntity> = PersonSortingMapper.mapDOSortOrderToQueryOrder(options?.order || {});
        const scope: Scope<PersonEntity> = new PersonScope()
            .byFirstName(personDo.firstName)
            .byLastName(personDo.lastName)
            .byBirthDate(personDo.birthDate)
            .allowEmptyQuery(true);

        if (order.id == null) {
            order.firstName = SortOrder.asc;
        }

        // if (personDo.firstName) {
        //     query['firstName'] = { $ilike: personDo.firstName };
        // }

        // if (personDo.lastName) {
        //     query['lastName'] = { $ilike: personDo.lastName };
        // }

        // if (personDo.referrer) {
        //     query['referrer'] = personDo.referrer;
        // }

        const [entities, total]: [PersonEntity[], number] = await this.em.findAndCount(PersonEntity, scope.personDo, {
            offset: pagination?.skip,
            limit: pagination?.limit,
        });

        const entityDos: PersonDo<true>[] = entities.map((person: PersonEntity) =>
            this.mapper.map(person, PersonEntity, PersonDo),
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const page: Page<PersonDo<true>[]> = new Page<PersonDo<true>>(entityDos, total);
        // return result.map((person: PersonEntity) => this.mapper.map(person, PersonEntity, PersonDo));
        return page;
    }
    // mapEntityToDO(entity: PersonEntity): PersonDo {
    //     const domainObject = PersonRepo.mapEntityToDO(entity);

    //     return domainObject;
    // }
}
