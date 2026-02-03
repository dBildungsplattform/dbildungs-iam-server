import { ApplyRollenerweiterungWorkflowFactory } from './apply-rollenerweiterungen-workflow.factory.js';
import { ApplyRollenerweiterungWorkflowAggregate } from './apply-rollenerweiterungen-workflow.js';
import { createMock } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';

describe('ApplyRollenerweiterungWorkflowFactory', () => {
    let factory: ApplyRollenerweiterungWorkflowFactory;

    beforeEach(() => {
        factory = new ApplyRollenerweiterungWorkflowFactory(
            createMock<ClassLogger>(),
            createMock<ServiceProviderRepo>(),
            createMock<OrganisationRepository>(),
            createMock<RolleRepo>(),
            createMock<RollenerweiterungRepo>(),
        );
    });

    it('should create a new ApplyRollenerweiterungWorkflowAggregate', () => {
        const workflow: ApplyRollenerweiterungWorkflowAggregate = factory.createNew();
        expect(workflow).toBeInstanceOf(ApplyRollenerweiterungWorkflowAggregate);
    });
});
