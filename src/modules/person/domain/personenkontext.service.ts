import { Injectable } from '@nestjs/common';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { PersonRepo } from '../persistence/person.repo.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextDo } from './personenkontext.do.js';
import { PersonDo } from './person.do.js';

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
    ): Promise<Result<PersonenkontextDo<true>[], DomainError>> {
        const personenkontexte: PersonenkontextDo<true>[] = await this.personenkontextRepo.findAll(personenkontextDo);

        if (personenkontexte.length === 0) {
            return { ok: false, error: new EntityNotFoundError('Personenkontext') };
        }

        return { ok: true, value: personenkontexte };
    }
}
