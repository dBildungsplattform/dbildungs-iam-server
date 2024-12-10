import { Injectable } from '@nestjs/common';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ImportWorkflow } from './import-workflow.js';
import { ImportDataRepository } from '../persistence/import-data.repository.js';
import { ImportVorgangRepository } from '../persistence/import-vorgang.repository.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ImportPasswordEncryptor } from './import-password-encryptor.js';

@Injectable()
export class ImportWorkflowFactory {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly importDataRepository: ImportDataRepository,
        private readonly importVorgangRepository: ImportVorgangRepository,
        private readonly importPasswordEncryptor: ImportPasswordEncryptor,
        private readonly eventService: EventService,
        private readonly logger: ClassLogger,
    ) {}

    public createNew(): ImportWorkflow {
        return ImportWorkflow.createNew(
            this.rolleRepo,
            this.organisationRepository,
            this.importDataRepository,
            this.importVorgangRepository,
            this.importPasswordEncryptor,
            this.eventService,
            this.logger,
        );
    }
}
