import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonenkontextAnlage } from './personenkontext-anlage.js';

@Injectable()
export class PersonenkontextAnlageFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
    ) {}

    public createNew(): PersonenkontextAnlage {
        return PersonenkontextAnlage.createNew(this.rolleRepo, this.organisationRepo);
    }
}
