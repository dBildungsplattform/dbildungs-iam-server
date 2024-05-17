import { Injectable } from '@nestjs/common';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { DomainError, EntityCouldNotBeDeleted, EntityNotFoundError } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextScope } from '../persistence/personenkontext.scope.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';

@Injectable()
export class PersonenkontextService {
    public constructor(
        private readonly personenkontextRepo: PersonenkontextRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
    ) {}

    public async createPersonenkontext(
        personenkontextDo: PersonenkontextDo<false>,
    ): Promise<Result<PersonenkontextDo<true>, DomainError>> {
        const personDo: Option<PersonDo<true>> = await this.personRepo.findById(personenkontextDo.personId);
        if (!personDo) {
            return { ok: false, error: new EntityNotFoundError('Person') };
        }

        const personenkontext: Option<PersonenkontextDo<true>> = await this.personenkontextRepo.save(personenkontextDo);
        if (personenkontext) {
            return { ok: true, value: personenkontext };
        }
        return { ok: false, error: new EntityCouldNotBeCreated(`Personenkontext`) };
    }

    public async findAllPersonenkontexte(
        personenkontextDo: PersonenkontextDo<false>,
        offset?: number,
        limit?: number,
    ): Promise<Paged<PersonenkontextDo<true>>> {
        const scope: PersonenkontextScope = new PersonenkontextScope()
            .findBy({
                personId: personenkontextDo.personId,
                referrer: personenkontextDo.referrer,
                rolle: personenkontextDo.rolle,
                personenstatus: personenkontextDo.personenstatus,
                sichtfreigabe: personenkontextDo.sichtfreigabe,
            })
            .sortBy('id', ScopeOrder.ASC)
            .paged(offset, limit);

        const [personenkontexte, total]: Counted<PersonenkontextDo<true>> =
            await this.personenkontextRepo.findBy(scope);

        return {
            offset: offset ?? 0,
            limit: limit ?? total,
            total,
            items: personenkontexte,
        };
    }

    public async findPersonenkontextById(id: string): Promise<Result<PersonenkontextDo<true>, DomainError>> {
        const personenkontext: Option<PersonenkontextDo<true>> = await this.personenkontextRepo.findById(id);
        const result: Result<PersonenkontextDo<true>, DomainError> = personenkontext
            ? { ok: true, value: personenkontext }
            : { ok: false, error: new EntityNotFoundError('Personenkontext', id) };

        return result;
    }

    public async findPersonenkontexteByPersonId(personId: string): Promise<Personenkontext<true>[]> {
        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);
        return personenkontexte;
    }

    public async updatePersonenkontext(
        personenkontextDo: PersonenkontextDo<true>,
    ): Promise<Result<PersonenkontextDo<true>, DomainError>> {
        const storedPersonenkontext: Option<PersonenkontextDo<true>> = await this.personenkontextRepo.findById(
            personenkontextDo.id,
        );

        if (!storedPersonenkontext) {
            return { ok: false, error: new EntityNotFoundError('Personenkontext', personenkontextDo.id) };
        }

        if (personenkontextDo.revision !== storedPersonenkontext.revision) {
            return {
                ok: false,
                error: new MismatchedRevisionError(
                    `Revision ${personenkontextDo.revision} does not match revision ${storedPersonenkontext.revision} of stored personenkontext.`,
                ),
            };
        }

        const newRevision: string = (parseInt(storedPersonenkontext.revision) + 1).toString();
        const newData: Partial<PersonenkontextDo<true>> = {
            referrer: personenkontextDo.referrer,
            personenstatus: personenkontextDo.personenstatus,
            jahrgangsstufe: personenkontextDo.jahrgangsstufe,
            revision: newRevision,
        };
        const updatedPersonenkontextDo: PersonenkontextDo<true> = Object.assign(storedPersonenkontext, newData);
        const saved: Option<PersonenkontextDo<true>> = await this.personenkontextRepo.save(updatedPersonenkontextDo);

        if (!saved) {
            return { ok: false, error: new EntityCouldNotBeUpdated('Personenkontext', updatedPersonenkontextDo.id) };
        }

        return { ok: true, value: saved };
    }

    public async deletePersonenkontextById(id: string, revision: string): Promise<Result<void, DomainError>> {
        const personenkontext: Option<PersonenkontextDo<true>> = await this.personenkontextRepo.findById(id);

        if (!personenkontext) {
            return { ok: false, error: new EntityNotFoundError('Personenkontext', id) };
        }

        if (personenkontext?.revision !== revision) {
            return { ok: false, error: new MismatchedRevisionError('Personenkontext') };
        }

        const deletedPersons: number = await this.personenkontextRepo.deleteById(id);

        if (deletedPersons === 0) {
            return { ok: false, error: new EntityCouldNotBeDeleted('Personenkontext', id) };
        }

        return { ok: true, value: undefined };
    }

    public async deletePersonenkontexteByPersonId(personId: string): Promise<Result<void, DomainError>> {

        const deletedPersonenkontexte: number = await this.dBiamPersonenkontextRepo.deleteByPerson(personId);

        if (deletedPersonenkontexte === 0) {
            return { ok: false, error: new EntityCouldNotBeDeleted('Personenkontext', personId) };
        }

        return { ok: true, value: undefined };
    }

}
