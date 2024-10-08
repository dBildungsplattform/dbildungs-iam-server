import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ImportWorkflowAggregate } from './import-workflow.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';

@Injectable()
export class ImportWorkflowFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly importDataRepository: ImportDataRepository,
    ) {}

    public createNew(): ImportWorkflowAggregate {
        return ImportWorkflowAggregate.createNew(
            this.rolleRepo,
            this.organisationRepository,
            this.importDataRepository,
        );
    }
}
