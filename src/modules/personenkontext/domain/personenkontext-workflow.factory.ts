import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ConfigService } from '@nestjs/config';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';

@Injectable()
export class PersonenkontextWorkflowFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly configService: ConfigService,
    ) {}

    public createNew(): PersonenkontextWorkflowAggregate {
        return PersonenkontextWorkflowAggregate.createNew(
            this.rolleRepo,
            this.organisationRepository,
            this.personenkontextRepo,
            this.dbiamPersonenkontextFactory,
            this.configService,
        );
    }
}
