import { ApplyRollenerweiterungWorkflowAggregate } from './apply-rollenerweiterungen-workflow.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ApplyRollenerweiterungBodyParams } from '../api/applyRollenerweiterung.body.params.js';
import { Rollenerweiterung } from './rollenerweiterung.js';
import { Rolle } from './rolle.js';
import { Ok } from '../../../shared/util/result.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { ApplyRollenerweiterungRolesError } from '../api/apply-rollenerweiterung-roles.error.js';
import { faker } from '@faker-js/faker';

describe('ApplyRollenerweiterungWorkflowAggregate', () => {
    let logger: DeepMocked<ClassLogger>;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;
    let organisationRepo: DeepMocked<OrganisationRepository>;
    let rolleRepo: DeepMocked<RolleRepo>;
    let rollenerweiterungRepo: DeepMocked<RollenerweiterungRepo>;
    let workflow: ApplyRollenerweiterungWorkflowAggregate;

    beforeEach(() => {
        logger = createMock<ClassLogger>();
        serviceProviderRepo = createMock<ServiceProviderRepo>();
        organisationRepo = createMock<OrganisationRepository>();
        rolleRepo = createMock<RolleRepo>();
        rollenerweiterungRepo = createMock<RollenerweiterungRepo>();
        workflow = ApplyRollenerweiterungWorkflowAggregate.createNew(
            logger,
            serviceProviderRepo,
            organisationRepo,
            rolleRepo,
            rollenerweiterungRepo,
        );
    });

    it('should initialize with existing Erweiterungen', async () => {
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValueOnce([
            createMock<Rollenerweiterung<true>>(),
        ]);
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        await workflow.initialize(orgaId, angebotId);
        expect(rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId).toHaveBeenCalledWith(
            orgaId,
            angebotId,
        );
    });

    it('should add and remove Erweiterungen successfully', async () => {
        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        const rolleIdAdd: string = faker.string.uuid();
        const rolleIdRemove: string = faker.string.uuid();

        const existingErw: Rollenerweiterung<true> = createMock<Rollenerweiterung<true>>({ rolleId: rolleIdRemove });
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([existingErw]);

        const rolleAdd: Rolle<true> = createMock<Rolle<true>>();
        const rolleRemove: Rolle<true> = createMock<Rolle<true>>();
        rolleRepo.findByIds.mockResolvedValue(
            new Map([
                [rolleIdAdd, rolleAdd],
                [rolleIdRemove, rolleRemove],
            ]),
        );

        rollenerweiterungRepo.createAuthorized.mockResolvedValue(Ok(createMock<Rollenerweiterung<true>>()));
        rollenerweiterungRepo.deleteByComposedId.mockResolvedValue(Ok(null));

        await workflow.initialize(orgaId, angebotId);

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [rolleIdAdd],
            removeErweiterungenForRolleIds: [rolleIdRemove],
        };
        const permissions: PersonPermissions = createMock<PersonPermissions>();

        const result: Result<null, ApplyRollenerweiterungRolesError> = await workflow.applyRollenerweiterungChanges(
            body,
            permissions,
        );
        expect(result.ok).toBe(true);
        expect(rollenerweiterungRepo.createAuthorized).toHaveBeenCalled();
        expect(rollenerweiterungRepo.deleteByComposedId).toHaveBeenCalled();
    });

    it('should return error if Rolle not found for add', async () => {
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([]);
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        const rolleId: string = faker.string.uuid();
        await workflow.initialize(orgaId, angebotId);

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [rolleId],
            removeErweiterungenForRolleIds: [],
        };
        const permissions: PersonPermissions = createMock<PersonPermissions>();

        const result: Result<null, ApplyRollenerweiterungRolesError> = await workflow.applyRollenerweiterungChanges(
            body,
            permissions,
        );
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(ApplyRollenerweiterungRolesError);
        expect(result.error.errors[0]?.id).toBe(rolleId);
        expect(result.error.errors[0]?.error).toBeInstanceOf(EntityNotFoundError);
    });

    it('should return error if Rolle not found for remove', async () => {
        const rolleIdRemove: string = faker.string.uuid();
        const existingErw: Rollenerweiterung<true> = createMock<Rollenerweiterung<true>>({ rolleId: rolleIdRemove });
        rollenerweiterungRepo.findManyByOrganisationIdAndServiceProviderId.mockResolvedValue([existingErw]);
        rolleRepo.findByIds.mockResolvedValue(new Map());

        const orgaId: string = faker.string.uuid();
        const angebotId: string = faker.string.uuid();
        await workflow.initialize(orgaId, angebotId);

        const body: ApplyRollenerweiterungBodyParams = {
            addErweiterungenForRolleIds: [],
            removeErweiterungenForRolleIds: [rolleIdRemove],
        };
        const permissions: PersonPermissions = createMock<PersonPermissions>();

        const result: Result<null, ApplyRollenerweiterungRolesError> = await workflow.applyRollenerweiterungChanges(
            body,
            permissions,
        );
        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }
        expect(result.error).toBeInstanceOf(ApplyRollenerweiterungRolesError);
        expect(result.error.errors[0]?.id).toBe(rolleIdRemove);
        expect(result.error.errors[0]?.error).toBeInstanceOf(EntityNotFoundError);
    });
});
