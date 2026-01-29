import { Injectable } from '@nestjs/common';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ApplyRollenerweiterungWorkflowAggregate } from './apply-rollenerweiterungen-workflow.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@Injectable()
export class ApplyRollenerweiterungWorkflowFactory {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public createNew(): ApplyRollenerweiterungWorkflowAggregate {
        return ApplyRollenerweiterungWorkflowAggregate.createNew(
            this.logger,
            this.serviceProviderRepo,
            this.organisationRepo,
            this.rolleRepo,
            this.rollenerweiterungRepo,
        );
    }
}
