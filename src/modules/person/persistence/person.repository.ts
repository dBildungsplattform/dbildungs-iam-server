import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PersonEntity } from './person.entity.js';
import { Person } from '../domain/person.js';
import { PersonScope } from './person.scope.js';

function mapEntityToAggregate(entity: PersonEntity): Person<true> {
    return Person.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.familienname,
        entity.vorname,
        entity.revision,
        undefined,
        undefined,
        entity.keycloakUserId,
        entity.referrer,
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
export class PersonRepository {
    public constructor(private readonly em: EntityManager) {}

    public async findBy(scope: PersonScope): Promise<Counted<Person<true>>> {
        const [entities, total]: Counted<PersonEntity> = await scope.executeQuery(this.em);
        const persons: Person<true>[] = entities.map((entity: PersonEntity) => mapEntityToAggregate(entity));
        return [persons, total];
    }

    public async findById(id: string): Promise<Option<Person<true>>> {
        const person: Option<PersonEntity> = await this.em.findOne(PersonEntity, { id });
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
}
