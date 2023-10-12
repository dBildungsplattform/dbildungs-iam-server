import { Injectable } from '@nestjs/common';
import { DomainError, EntityNotFoundError, PersonAlreadyExistsError } from '../../../shared/error/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonScope } from '../persistence/person.scope.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';

@Injectable()
export class PersonService {
    public constructor(private readonly personRepo: PersonRepo) {}

    public async createPerson(personDo: PersonDo<false>): Promise<Result<PersonDo<true>, DomainError>> {
        if (personDo.referrer && (await this.personRepo.findByReferrer(personDo.referrer))) {
            return {
                ok: false,
                error: new PersonAlreadyExistsError(`Person with referrer ${personDo.referrer} already exists`),
            };
        }
        const newPerson: PersonDo<true> = await this.personRepo.save(personDo);
        return { ok: true, value: newPerson };
    }

    public async findPersonById(id: string): Promise<Result<PersonDo<true>, DomainError>> {
        const person: Option<PersonDo<true>> = await this.personRepo.findById(id);
        if (person) {
            return { ok: true, value: person };
        }
        return { ok: false, error: new EntityNotFoundError(`Person with the following ID ${id} does not exist`) };
    }

    public async findAllPersons(personDto: PersonDo<false>): Promise<Paged<PersonDo<true>>> {
        const scope: PersonScope = new PersonScope()
            .searchBy({
                firstName: personDto.firstName,
                lastName: personDto.lastName,
                birthDate: personDto.birthDate,
            })
            .sortBy('firstName', ScopeOrder.ASC)
            .paged(0, 100);
        const [persons, total]: Counted<PersonDo<true>> = await this.personRepo.findBy(scope);

        return {
            total,
            offset: 0,
            limit: 100,
            items: persons,
        };
    }
}
