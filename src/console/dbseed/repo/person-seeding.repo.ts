import {
    mapAggregateToData,
    mapEntityToAggregateInplace,
    PersonRepository,
} from '../../../modules/person/persistence/person.repository.js';
import { Injectable } from '@nestjs/common';
import { Person } from '../../../modules/person/domain/person.js';
import { PersonEntity } from '../../../modules/person/persistence/person.entity.js';
import { DomainError } from '../../../shared/error/index.js';

@Injectable()
export class PersonSeedingRepo extends PersonRepository {
    public override async create(person: Person<boolean>): Promise<Person<true> | DomainError> {
        const personWithKeycloakUser: Person<false> | DomainError = await this.createKeycloakUser(
            person,
            this.kcUserService,
        );
        if (personWithKeycloakUser instanceof DomainError) {
            return personWithKeycloakUser;
        }
        const personEntity: PersonEntity = this.em.create(PersonEntity, mapAggregateToData(personWithKeycloakUser));
        this.em.persist(personEntity);

        return mapEntityToAggregateInplace(personEntity, personWithKeycloakUser);
    }
}
