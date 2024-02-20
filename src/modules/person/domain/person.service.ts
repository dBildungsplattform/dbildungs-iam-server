import { Injectable } from '@nestjs/common';
import {
    DomainError,
    EntityCouldNotBeUpdated,
    EntityNotFoundError,
    MismatchedRevisionError,
    PersonAlreadyExistsError,
} from '../../../shared/error/index.js';
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

    // DONE --> COULD BE REMOVED
    public async findPersonById(id: string): Promise<Result<PersonDo<true>, DomainError>> {
        const person: Option<PersonDo<true>> = await this.personRepo.findById(id);
        if (person) {
            return { ok: true, value: person };
        }
        return { ok: false, error: new EntityNotFoundError(`Person with the following ID ${id} does not exist`) };
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

    public async updatePerson(personDo: PersonDo<true>): Promise<Result<PersonDo<true>, DomainError>> {
        const storedPerson: Option<PersonDo<true>> = await this.personRepo.findById(personDo.id);

        if (!storedPerson) {
            return { ok: false, error: new EntityNotFoundError('Person', personDo.id) };
        }

        if (personDo.revision !== storedPerson.revision) {
            return {
                ok: false,
                error: new MismatchedRevisionError(
                    `Revision ${personDo.revision} does not match revision ${storedPerson.revision} of stored person.`,
                ),
            };
        }

        const newRevision: string = (parseInt(storedPerson.revision) + 1).toString();
        const newData: Partial<PersonDo<true>> = {
            referrer: personDo.referrer,
            stammorganisation: personDo.stammorganisation,
            familienname: personDo.familienname,
            vorname: personDo.vorname,
            initialenFamilienname: personDo.initialenFamilienname,
            initialenVorname: personDo.initialenVorname,
            rufname: personDo.rufname,
            nameTitel: personDo.nameTitel,
            nameAnrede: personDo.nameAnrede,
            namePraefix: personDo.namePraefix,
            nameSuffix: personDo.nameSuffix,
            nameSortierindex: personDo.nameSortierindex,
            geburtsdatum: personDo.geburtsdatum,
            geburtsort: personDo.geburtsort,
            geschlecht: personDo.geschlecht,
            lokalisierung: personDo.lokalisierung,
            vertrauensstufe: personDo.vertrauensstufe,
            auskunftssperre: personDo.auskunftssperre,
            revision: newRevision,
        };
        const updatedPersonDo: PersonDo<true> = Object.assign(storedPerson, newData);
        const saved: Option<PersonDo<true>> = await this.personRepo.save(updatedPersonDo);

        if (!saved) {
            return { ok: false, error: new EntityCouldNotBeUpdated('Person', updatedPersonDo.id) };
        }

        return { ok: true, value: saved };
    }
}
