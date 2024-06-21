import { Injectable } from '@nestjs/common';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonScope } from '../persistence/person.scope.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonFactory } from './person.factory.js';
import { Person } from './person.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontextWorkflowFactory } from '../../personenkontext/domain/personenkontext-workflow.factory.js';
import { PersonenkontextWorkflowAggregate } from '../../personenkontext/domain/personenkontext-workflow.js';

export type PersonPersonenkontext = {
    person: Person<true>;
    personenkontext: Personenkontext<true>;
};

@Injectable()
export class PersonService {
    public constructor(
        private readonly personRepo: PersonRepo,
        private readonly personRepository: PersonRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personFactory: PersonFactory,
        private readonly personenkontextFactory: PersonenkontextFactory,
        private readonly personenkontextWorkflowFactory: PersonenkontextWorkflowFactory,
    ) {}

    public async findPersonById(id: string): Promise<Result<PersonDo<true>, DomainError>> {
        const person: Option<PersonDo<true>> = await this.personRepo.findById(id);
        if (person) {
            return { ok: true, value: person };
        }
        return { ok: false, error: new EntityNotFoundError('Person', id) };
    }

    public async findAllPersons(
        personDo: Partial<PersonDo<false>>,
        offset?: number,
        limit?: number,
    ): Promise<Paged<PersonDo<true>>> {
        const scope: PersonScope = new PersonScope()
            .findBy({
                vorname: personDo.vorname,
                familienname: personDo.familienname,
                geburtsdatum: personDo.geburtsdatum,
            })
            .sortBy('vorname', ScopeOrder.ASC)
            .paged(offset, limit);
        const [persons, total]: Counted<PersonDo<true>> = await this.personRepo.findBy(scope);

        return {
            total,
            offset: offset ?? 0,
            limit: limit ?? total,
            items: persons,
        };
    }

    public async createPersonWithPersonenkontext(
        permissions: PersonPermissions,
        vorname: string,
        familienname: string,
        organisationId: string,
        rolleId: string,
    ): Promise<PersonPersonenkontext | DomainError> {
        const person: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: vorname,
            familienname: familienname,
        });
        if (person instanceof DomainError) {
            return person;
        }
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();

        anlage.initialize(organisationId, rolleId);

        // Check if permissions are enough to create the kontext
        const canCommit: DomainError | undefined = await anlage.canCommit(permissions, organisationId, rolleId);

        if (canCommit) {
            return canCommit;
        }
        //Save Person
        const savedPerson: DomainError | Person<true> = await this.personRepository.create(person);
        if (savedPerson instanceof DomainError) {
            return savedPerson;
        }

        const personenkontext: Personenkontext<false> = this.personenkontextFactory.createNew(
            savedPerson.id,
            organisationId,
            rolleId,
        );
        //Save Personenkontext
        const savedPersonenkontext: Personenkontext<true> = await this.personenkontextRepo.save(personenkontext);
        return {
            person: savedPerson,
            personenkontext: savedPersonenkontext,
        };
    }
}
