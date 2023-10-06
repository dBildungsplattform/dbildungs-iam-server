import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/index.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { PersonenkontextRepo } from '../persistence/personenkontext.repo.js';
import { PersonenkontextDo } from './personenkontext.do.js';

@Injectable()
export class PersonenkontextService {
    public constructor(private readonly personenkontextRepo: PersonenkontextRepo) {}

    public async createPersonenkontext(
        personenkontextDo: PersonenkontextDo<false>,
    ): Promise<Result<PersonenkontextDo<true>, DomainError>> {
        const personenkontext: PersonenkontextDo<true> = await this.personenkontextRepo.save(personenkontextDo);
        if (personenkontext) {
            return { ok: true, value: personenkontext };
        }
        return { ok: false, error: new EntityCouldNotBeCreated(`Personenkontext`) };
    }
}
