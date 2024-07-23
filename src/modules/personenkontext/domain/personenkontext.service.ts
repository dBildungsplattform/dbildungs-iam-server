import { Injectable } from '@nestjs/common';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { DomainError, EntityCouldNotBeDeleted, EntityNotFoundError } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOperator, ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextScope } from '../persistence/personenkontext.scope.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from './personenkontext.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonenkontextQueryParams } from '../api/param/personenkontext-query.params.js';
import { UpdatePersonenkontextDto } from '../api/update-personenkontext.dto.js';

@Injectable()
export class PersonenkontextService {
    public constructor(
        private readonly personenkontextRepo: PersonenkontextRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepo,
    ) {}

    //NOTE not going to be used anymore because current implmentation needs org id and rolle id
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
        personenkontext: PersonenkontextQueryParams,
        organisationIDs?: OrganisationID[] | undefined,
        offset?: number,
        limit?: number,
    ): Promise<Paged<Personenkontext<true>>> {
        const scope: PersonenkontextScope = new PersonenkontextScope()
            .setScopeWhereOperator(ScopeOperator.AND)
            .byOrganisations(organisationIDs)
            .findBy({
                personId: personenkontext.personId,
                referrer: personenkontext.referrer,
                rolle: personenkontext.rolle,
                personenstatus: personenkontext.personenstatus,
                sichtfreigabe: personenkontext.sichtfreigabe,
            })
            .sortBy('id', ScopeOrder.ASC)
            .paged(offset, limit);

        const [personenkontexte, total]: Counted<Personenkontext<true>> =
            await this.dBiamPersonenkontextRepo.findBy(scope);

        return {
            offset: offset ?? 0,
            limit: limit ?? total,
            total,
            items: personenkontexte,
        };
    }

    public async findPersonenkontextById(id: string): Promise<Result<Personenkontext<true>, DomainError>> {
        const personenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.findByID(id);
        const result: Result<Personenkontext<true>, DomainError> = personenkontext
            ? { ok: true, value: personenkontext }
            : { ok: false, error: new EntityNotFoundError('Personenkontext', id) };

        return result;
    }

    public async findPersonenkontexteByPersonId(personId: string): Promise<Personenkontext<true>[]> {
        const personenkontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);
        return personenkontexte;
    }

    public async updatePersonenkontext(
        personenkontextDo: UpdatePersonenkontextDto,
    ): Promise<Result<Personenkontext<true>, DomainError>> {
        const storedPersonenkontext: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.findByID(
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
        const newData: Partial<Personenkontext<true>> = {
            referrer: personenkontextDo.referrer,
            personenstatus: personenkontextDo.personenstatus,
            jahrgangsstufe: personenkontextDo.jahrgangsstufe,
            revision: newRevision,
        };
        const updatedPersonenkontextDo: Personenkontext<true> = Object.assign(storedPersonenkontext, newData);
        const saved: Option<Personenkontext<true>> = await this.dBiamPersonenkontextRepo.save(updatedPersonenkontextDo);

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
}
