import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow-anlage.js';

@Injectable()
export class PersonenkontextAnlageFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
    ) {}

    public createNew(): PersonenkontextWorkflowAggregate {
        return PersonenkontextWorkflowAggregate.createNew(this.rolleRepo, this.organisationRepo);
    }
}
