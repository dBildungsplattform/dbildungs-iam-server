import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { FindRolleByIdParams } from './find-rolle-by-id.params.js';
import { RolleController } from './rolle.controller.js';

import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { NameForRolleWithTrailingSpaceError } from '../domain/name-with-trailing-space.error.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { CreateRollenerweiterungBodyParams } from './create-rollenerweiterung.body.params.js';
import { RolleServiceProviderBodyParams } from './rolle-service-provider.body.params.js';
import { RollenerweiterungResponse } from './rollenerweiterung.response.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';

describe('Rolle API with mocked ServiceProviderRepo', () => {
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let rolleController: RolleController;
    let organisationServiceMock: DeepMocked<OrganisationService>;
    let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [LoggingTestModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: RolleRepo,
                    useValue: createMock(RolleRepo),
                },
                {
                    provide: OrganisationService,
                    useValue: createMock(OrganisationService),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock(OrganisationRepository),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock(ServiceProviderRepo),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock(DBiamPersonenkontextRepo),
                },
                {
                    provide: OrganisationService,
                    useValue: createMock(OrganisationService),
                },
                {
                    provide: RollenerweiterungRepo,
                    useValue: createMock(RollenerweiterungRepo),
                },
                RolleController,
                RolleFactory,
                RollenerweiterungFactory,
            ],
        }).compile();

        rolleRepoMock = module.get(RolleRepo);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        rolleController = module.get(RolleController);
        organisationServiceMock = module.get(OrganisationService);
        rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('/PUT rolleId/serviceProviders mocked SP-repo', () => {
        describe('when rolle and serviceProvider exists, attachment is done, but retrieving SP afterwards fails', () => {
            it('should return 500', async () => {
                const rolleId: string = faker.string.uuid();
                const rolleByIdParams: FindRolleByIdParams = {
                    rolleId: rolleId,
                };
                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [faker.string.uuid()],
                    version: 1,
                };
                //mock get-rolle
                rolleRepoMock.findById.mockResolvedValueOnce(DoFactory.createRolle<true>(true));

                // Mock the call to find service providers by IDs, returning an empty map
                serviceProviderRepoMock.findByIds.mockResolvedValueOnce(new Map());

                await expect(rolleController.updateServiceProvidersById(rolleByIdParams, params)).rejects.toThrow(
                    Error,
                );
            });
        });
    });

    describe('/GET rolle mocked Rolle-repo', () => {
        describe('createRolle', () => {
            const permissionsMock: PersonPermissions = createPersonPermissionsMock();
            it('should throw an HTTP exception when rolleFactory.createNew returns DomainError', async () => {
                const createRolleParams: CreateRolleBodyParams = {
                    name: ' SuS',
                    administeredBySchulstrukturknoten: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                    merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT],
                    systemrechte: [RollenSystemRechtEnum.KLASSEN_VERWALTEN],
                };

                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                organisationServiceMock.findOrganisationById.mockResolvedValueOnce({
                    ok: true,
                    value: organisation,
                });

                await expect(rolleController.createRolle(createRolleParams, permissionsMock)).rejects.toThrow(
                    NameForRolleWithTrailingSpaceError,
                );
            });
        });
    });

    describe('POST rolle/erweiterung', () => {
        describe('createRollenerweiterung', () => {
            let createRollenerweiterungParams: CreateRollenerweiterungBodyParams;
            let permissions: PersonPermissions;
            beforeEach(() => {
                createRollenerweiterungParams = new CreateRollenerweiterungBodyParams();
                Object.assign(createRollenerweiterungParams, {
                    organisationId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                    serviceProviderId: faker.string.uuid(),
                });
                permissions = createPersonPermissionsMock();
            });

            it('should return the response', async () => {
                rollenerweiterungRepoMock.createAuthorized.mockResolvedValueOnce({
                    ok: true,
                    value: DoFactory.createRollenerweiterung<true>(true, createRollenerweiterungParams),
                });
                const result: RollenerweiterungResponse = await rolleController.createRollenerweiterung(
                    createRollenerweiterungParams,
                    permissions,
                );
                expect(result).toBeInstanceOf(RollenerweiterungResponse);
                expect(result).toEqual(
                    expect.objectContaining({
                        organisationId: createRollenerweiterungParams.organisationId,
                        rolleId: createRollenerweiterungParams.rolleId,
                        serviceProviderId: createRollenerweiterungParams.serviceProviderId,
                    }),
                );
            });

            it('should throw an HTTP exception when rollenerweiterung can not be created', async () => {
                rollenerweiterungRepoMock.createAuthorized.mockResolvedValueOnce({
                    ok: false,
                    error: new MissingPermissionsError('dummy error'),
                });
                await expect(
                    rolleController.createRollenerweiterung(createRollenerweiterungParams, permissions),
                ).rejects.toThrow(MissingPermissionsError);
            });
        });
    });
});
