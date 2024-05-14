import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { Personenkontext } from './personenkontext.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { DBiamPersonenkontextService } from './dbiam-personenkontext.service.js';

@Injectable()
export class PersonenkontextFactory {
    public constructor(
        private rolleRepo: RolleRepo,
        private organisationRepo: OrganisationRepo,
        private personRepo: PersonRepo,
        private dbiamPersonenkontextService: DBiamPersonenkontextService,
    ) {

    }

    public async createNew( personId: string,
        organisationId: string,
        rolleId: string,
    ): Promise<Personenkontext<false> | DomainError> {
        return Personenkontext.createNew(
            this.personRepo,
            this.organisationRepo,
            this.rolleRepo,
            this.dbiamPersonenkontextService,
            personId,
            organisationId,
            rolleId,
        );
    }
}
