import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextAnlage } from './personenkontext-anlage.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';

@Injectable()
export class PersonenkontextAnlageFactory {
    public constructor(
        private rolleRepo: RolleRepo,
        private organisationRepo: OrganisationRepo,
        private dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private personRepo: PersonRepo,
    ) {}

    public createNew(): PersonenkontextAnlage {
        return PersonenkontextAnlage.createNew(
            this.rolleRepo,
            this.organisationRepo,
            this.dBiamPersonenkontextRepo,
            this.personRepo,
        );
    }
}
