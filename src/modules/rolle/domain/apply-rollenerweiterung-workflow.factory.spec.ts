import { ApplyRollenerweiterungWorkflowFactory } from './apply-rollenerweiterungen-workflow.factory.js';
import { ApplyRollenerweiterungWorkflowAggregate } from './apply-rollenerweiterungen-workflow.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { createMock } from '../../../../test/utils/createMock.js';

describe('ApplyRollenerweiterungWorkflowFactory', () => {
    let factory: ApplyRollenerweiterungWorkflowFactory;

    beforeEach(() => {
        factory = new ApplyRollenerweiterungWorkflowFactory(
            createMock<ClassLogger>(ClassLogger),
            createMock<ServiceProviderRepo>(ServiceProviderRepo),
            createMock<OrganisationRepository>(OrganisationRepository),
            createMock<RolleRepo>(RolleRepo),
            createMock<RollenerweiterungRepo>(RollenerweiterungRepo),
        );
    });

    it('should create a new ApplyRollenerweiterungWorkflowAggregate', () => {
        const workflow: ApplyRollenerweiterungWorkflowAggregate = factory.createNew();
        expect(workflow).toBeInstanceOf(ApplyRollenerweiterungWorkflowAggregate);
    });
});
