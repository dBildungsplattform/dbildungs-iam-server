import { Mock, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_PIPE } from '@nestjs/core';
import { createPersonPermissionsMock, DoFactory, LoggingTestModule } from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { RollenerweiterungController } from './rollenerweiterung.controller.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ApplyRollenerweiterungPathParams } from './apply-rollenerweiterung-changes.path.params.js';
import { ApplyRollenerweiterungBodyParams } from './apply-rollenerweiterung.body.params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ApplyRollenerweiterungService } from '../domain/apply-rollenerweiterungen-service.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';
import { DomainError, MissingPermissionsError } from '../../../shared/error/index.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { HttpException } from '@nestjs/common';

describe('RollenerweiterungController', () => {
    let controller: RollenerweiterungController;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let applyRollenerweiterungServiceMock: DeepMocked<ApplyRollenerweiterungService>;

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
                    provide: ApplyRollenerweiterungService,
                    useValue: createMock<ApplyRollenerweiterungService>(ApplyRollenerweiterungService),
                },
                RollenerweiterungController,
            ],
        }).compile();

        controller = module.get(RollenerweiterungController);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        applyRollenerweiterungServiceMock = module.get(ApplyRollenerweiterungService);
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

            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: true,
                value: null,
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).resolves.toBeUndefined();
        });

        it('should log error with failed and successful rollen ids when ApplyRollenerweiterungWorkflowAggregate returns error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: ['rollenId1', 'rollenId2', 'rollenId3'],
                removeErweiterungenForRolleIds: ['rollenId4'],
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            serviceProviderRepoMock.findById.mockResolvedValueOnce(
                DoFactory.createServiceProvider(true, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            organisationRepoMock.findById.mockResolvedValueOnce(DoFactory.createOrganisation(true));

            const errorRollenId2: { id: string; error: DomainError } = {
                id: 'rollenId2',
                error: new EntityNotFoundError('Rolle', 'rollenId2'),
            };
            const errorRollenId4: { id: string; error: DomainError } = {
                id: 'rollenId4',
                error: new EntityNotFoundError('Rolle', 'rollenId4'),
            };
            const loggerInfoSpy: Mock<(message: string, trace?: unknown) => void> = vi.spyOn(
                controller['logger'],
                'info',
            );
            const loggerErrorSpy: Mock<(message: string, trace?: unknown) => void> = vi.spyOn(
                controller['logger'],
                'error',
            );

            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new ApplyRollenerweiterungRolesError([
                    { rolleId: 'rollenId2', error: errorRollenId2 as unknown as DomainError },
                    { rolleId: 'rollenId4', error: errorRollenId4 as unknown as DomainError },
                ]),
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow();

            expect(loggerInfoSpy).toHaveBeenCalledWith(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} with 3 x ADD (rollenId1, rollenId2, rollenId3) and 1 x REMOVE (rollenId4).`,
            );

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(`success for rollen: rollenId1, rollenId3`),
            );
        });

        it('should throw if ApplyRollenerweiterungService returns ApplyRollenerweiterungRolesError error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new ApplyRollenerweiterungRolesError([]),
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                ApplyRollenerweiterungRolesError,
            );
        });

        it('should throw if ApplyRollenerweiterungService returns EntityNotFoundError error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new EntityNotFoundError(),
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                HttpException,
            ); //Mapped to SchulConnexHttpException
        });

        it('should throw if ApplyRollenerweiterungService returns MissingPermissionsError error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new MissingPermissionsError(''),
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                HttpException,
            ); //Mapped to SchulConnexHttpException
        });

        it('should throw if ApplyRollenerweiterungService returns MissingMerkmalVerfuegbarFuerRollenerweiterungError error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new MissingMerkmalVerfuegbarFuerRollenerweiterungError(),
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow(
                MissingMerkmalVerfuegbarFuerRollenerweiterungError,
            );
        });

        it('should throw if ApplyRollenerweiterungService returns unknown error', async () => {
            const params: ApplyRollenerweiterungPathParams = {
                angebotId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
            };
            const permissions: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            const body: ApplyRollenerweiterungBodyParams = {
                addErweiterungenForRolleIds: [],
                removeErweiterungenForRolleIds: [],
            };
            applyRollenerweiterungServiceMock.applyRollenerweiterungChanges.mockResolvedValueOnce({
                ok: false,
                error: new Error() as unknown as MissingMerkmalVerfuegbarFuerRollenerweiterungError,
            });

            await expect(controller.applyRollenerweiterungChanges(params, body, permissions)).rejects.toThrow();
        });
    });
});
