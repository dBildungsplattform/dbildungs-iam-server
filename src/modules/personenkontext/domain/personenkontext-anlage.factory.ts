import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextAnlage } from './personenkontext-anlage.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';

@Injectable()
export class PersonenkontextAnlageFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personenkontextFactory: PersonenkontextFactory,
    ) {}

    public createNew(): PersonenkontextAnlage {
        return PersonenkontextAnlage.createNew(
            this.rolleRepo,
            this.organisationRepo,
            this.dBiamPersonenkontextRepo,
            this.personenkontextFactory,
        );
    }
}
