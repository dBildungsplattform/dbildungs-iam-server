import { Injectable } from '@nestjs/common';

import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { DbiamPersonenkontextFactory } from '../../personenkontext/domain/dbiam-personenkontext.factory.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { LandesbediensteteWorkflowAggregate } from './landesbedienstete-workflow.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonLandesbediensteterSearchService } from '../../person/person-landesbedienstete-search/person-landesbediensteter-search.service.js';

@Injectable()
export class LandesbediensteteWorkflowFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personRepo: PersonRepository,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly landesbediensteteSearchService: PersonLandesbediensteterSearchService,
    ) {}

    public createNew(): LandesbediensteteWorkflowAggregate {
        return LandesbediensteteWorkflowAggregate.createNew(
            this.rolleRepo,
            this.organisationRepository,
            this.personenkontextRepo,
            this.dbiamPersonenkontextFactory,
            this.personRepo,
            this.landesbediensteteSearchService,
        );
    }
}
