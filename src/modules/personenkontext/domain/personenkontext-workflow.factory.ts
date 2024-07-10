import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

@Injectable()
export class PersonenkontextWorkflowFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
    ) {}

    public createNew(): PersonenkontextWorkflowAggregate {
        return PersonenkontextWorkflowAggregate.createNew(
            this.rolleRepo,
            this.organisationRepo,
            this.organisationRepository,
            this.dbiamPersonenkontextFactory,
        );
    }
}
