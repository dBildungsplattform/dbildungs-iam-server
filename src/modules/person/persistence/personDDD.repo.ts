import { EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Person } from '../domain/person.js';
import { PersonEntity } from './person.entity.js';

export function mapAggregateToData(person: Person<boolean>): RequiredEntityData<PersonEntity> {
    return {
        keycloakUserId: person.keycloakUserId,
        referrer: person.referrer,
        mandant: person.mandant,
        stammorganisation: person.stammorganisation,
        familienname: person.familienname,
        vorname: person.vorname,
        initialenFamilienname: person.initialenFamilienname,
        initialenVorname: person.initialenVorname,
        rufname: person.rufname,
        nameTitel: person.nameTitel,
        nameAnrede: person.nameAnrede,
        namePraefix: person.namePraefix,
        nameSuffix: person.nameSuffix,
        nameSortierindex: person.nameSortierindex,
        geburtsdatum: person.geburtsdatum,
        geburtsort: person.geburtsort,
        geschlecht: person.geschlecht,
        lokalisierung: person.lokalisierung,
        vertrauensstufe: person.vertrauensstufe,
        auskunftssperre: person.auskunftssperre,
        dataProvider: '',
        revision: person.revision
    };
}

function mapEntityToAggregate(entity: PersonEntity): Person<true> {

    return Person.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.keycloakUserId,
        entity.mandant,
        entity.familienname,
        entity.vorname,
        entity.revision,
        entity.keycloakUserId,
        entity.stammorganisation,
        entity.initialenFamilienname,
        entity.initialenVorname,
        entity.rufname,
        entity.nameTitel,
        entity.nameAnrede,
        entity.namePraefix,
        entity.nameSuffix,
        entity.nameSortierindex,
        entity.geburtsdatum,
        entity.geburtsort,
        entity.geschlecht,
        entity.lokalisierung,
        entity.vertrauensstufe,
        entity.auskunftssperre,
    );
}

@Injectable()
export class PersonDDDRepo {
    public constructor(private readonly em: EntityManager) {}

    public get entityName(): EntityName<PersonEntity> {
        return PersonEntity;
    }

    /*
    public async findBy(scope: PersonScope): Promise<Counted<Person<true>>> {
        const [entities, total]: Counted<PersonEntity> = await scope.executeQuery(this.em);
        const dos: Person<true>[] = entities.map((entity: PersonEntity) => mapEntityToAggregate(entity));
        return [dos, total];
    }
    */

    public async findById(id: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { id });
        if (person) {
            return mapEntityToAggregate(person);
        }
        return null;
    }

    public async findByReferrer(referrer: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(this.entityName, { referrer });
        if (person) {
            return mapEntityToAggregate(person);
        }
        return null;
    }

    public async findByKeycloakUserId(keycloakUserId: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { keycloakUserId });
        if (person) {
            return mapEntityToAggregate(person);
        }
        return null;
    }

    public async deleteById(id: string): Promise<Option<Person<false>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { id });
        if (person) {
            await this.em.removeAndFlush(person);
            //Todo: Return removed person
        }
        return null;
    }

    public async save(person: Person<boolean>): Promise<Person<true>> {
        if (person.id) {
            return this.update(person);
        } else {
            return this.create(person);
        }
    }

    private async create(person: Person<false>): Promise<Person<true>> {
        const personEntity: PersonEntity = this.em.create(PersonEntity, mapAggregateToData(person));
        await this.em.persistAndFlush(personEntity);
        return mapEntityToAggregate(personEntity);
    }

    private async update(person: Person<true>): Promise<Person<true>> {
        if (person.id === undefined) {
            throw new Error('Person ID is undefined, cannot perform lookup.');
        }
        const personEntity: Loaded<PersonEntity> = await this.em.findOneOrFail(PersonEntity, person.id);
        personEntity.assign(mapAggregateToData(person), { merge: true });
        await this.em.persistAndFlush(personEntity);
        return mapEntityToAggregate(personEntity);
    }
}
