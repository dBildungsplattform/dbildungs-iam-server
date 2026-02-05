import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_PIPE } from '@nestjs/core';
import { createPersonPermissionsMock, DoFactory, LoggingTestModule } from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { RollenerweiterungController } from './rollenerweiterung.controller.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ApplyRollenerweiterungWorkflowFactory } from '../domain/apply-rollenerweiterungen-workflow.factory.js';
import { ApplyRollenerweiterungPathParams } from './apply-rollenerweiterung-changes.path.params.js';
import { ApplyRollenerweiterungBodyParams } from './apply-rollenerweiterung.body.params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { faker } from '@faker-js/faker';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ApplyRollenerweiterungWorkflowAggregate } from '../domain/apply-rollenerweiterungen-workflow.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';

describe('RollenerweiterungController', () => {
    let controller: RollenerweiterungController;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let applyRollenerweiterungWorkflowFactoryMock: DeepMocked<ApplyRollenerweiterungWorkflowFactory>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(ClassLogger),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(ServiceProviderRepo),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(OrganisationRepository),
                },
                {
                    provide: ApplyRollenerweiterungWorkflowFactory,
                    useValue: createMock<ApplyRollenerweiterungWorkflowFactory>(ApplyRollenerweiterungWorkflowFactory),
                },
                RollenerweiterungController,
            ],
        }).compile();

        controller = module.get(RollenerweiterungController);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        applyRollenerweiterungWorkflowFactoryMock = module.get(ApplyRollenerweiterungWorkflowFactory);
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('applyRollenerweiterungChanges', () => {
        it('should apply Rollenerweiterungen', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createServiceProvider(true, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            applyRollenerweiterungWorkflowFactoryMock.createNew.mockReturnValue(
                createMock<ApplyRollenerweiterungWorkflowAggregate>(ApplyRollenerweiterungWorkflowAggregate, {
                    initialize: vi.fn().mockResolvedValueOnce(undefined),
                    applyRollenerweiterungChanges: vi.fn().mockResolvedValueOnce({ ok: true, value: null }),
                }),
            );

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).resolves.toBeUndefined();
        });

        it('should throw if ApplyRollenerweiterungWorkflowAggregate returns error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createServiceProvider(true, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));
            applyRollenerweiterungWorkflowFactoryMock.createNew.mockReturnValue(
                createMock<ApplyRollenerweiterungWorkflowAggregate>(ApplyRollenerweiterungWorkflowAggregate, {
                    initialize: vi.fn().mockResolvedValueOnce(undefined),
                    applyRollenerweiterungChanges: vi
                        .fn()
                        .mockRejectedValueOnce({ ok: false, error: new ApplyRollenerweiterungRolesError([]) }),
                }),
            );

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow();
        });
        it('should throw if permissions are missing', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                        new MissingPermissionsError('Not authorized'),
                    ),
                ),
            );
        });

        it('should throw if organisation not found', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createServiceProvider(true, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                        new EntityNotFoundError('Orga', params.organisationId),
                    ),
                ),
            );
        });

        it('should throw if service provider not found', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(undefined);
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                        new EntityNotFoundError('Angebot', params.angebotId),
                    ),
                ),
            );
        });

        it('should throw if service provider found but not verfuegbar fuer rollenerweiterung', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createServiceProvider(true, {
                    merkmale: [],
                }),
            );
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                MissingMerkmalVerfuegbarFuerRollenerweiterungError,
            );
        });
    });
});
