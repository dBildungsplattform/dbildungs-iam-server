import { Injectable } from '@nestjs/common';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextScope } from '../persistence/personenkontext.scope.js';
import { PersonDo } from './person.do.js';
import { PersonenkontextDo } from './personenkontext.do.js';

@Injectable()
export class PersonenkontextService {
    public constructor(
        private readonly personenkontextRepo: PersonenkontextRepo,
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

        const [personenkontexte, total]: Counted<PersonenkontextDo<true>> = await this.personenkontextRepo.findBy(
            scope,
        );

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
}
