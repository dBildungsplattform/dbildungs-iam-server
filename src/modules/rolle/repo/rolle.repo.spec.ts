import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from './rolle.repo.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { EventService } from '../../../core/eventbus/index.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationID } from '../../../shared/types/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RollenMerkmal, RollenSystemRecht } from '../domain/rolle.enums.js';

describe('RolleRepo', () => {
    let module: TestingModule;
    let sut: RolleRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let serviceProviderRepo: ServiceProviderRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [RolleRepo, RolleFactory, ServiceProviderRepo, OrganisationRepository, EventService],
        }).compile();

        sut = module.get(RolleRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        serviceProviderRepo = module.get(ServiceProviderRepo);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('save', () => {
        it('should save a new rolle', async () => {
            const rolle: Rolle<false> = DoFactory.createRolle(false);

            const savedRolle: Rolle<true> = await sut.save(rolle);

            expect(savedRolle.id).toBeDefined();
        });

        it('should update an existing rolle', async () => {
            const existingRolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));
            const update: Rolle<false> = DoFactory.createRolle(false);
            update.id = existingRolle.id;

            const savedRolle: Rolle<true> = await sut.save(existingRolle);

            expect(savedRolle).toEqual(existingRolle);
        });

        it('should save with service provider', async () => {
            const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolle: Rolle<false> = DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] });

            const savedRolle: Rolle<true> = await sut.save(rolle);

            expect(savedRolle.id).toBeDefined();
            expect(savedRolle.serviceProviderIds).toContain(serviceProvider.id);
        });
    });

    describe('find', () => {
        it('should return all rollen', async () => {
            const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rollen: Rolle<true>[] = await Promise.all([
                sut.save(DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] })),
                sut.save(DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] })),
                sut.save(DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] })),
            ]);

            const rollenResult: Rolle<true>[] = await sut.find();

            expect(rollenResult).toHaveLength(3);
            expect(rollenResult).toEqual(rollen);
        });
    });

    describe('findById', () => {
        it('should return the rolle', async () => {
            const rolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));

            const rolleResult: Option<Rolle<true>> = await sut.findById(rolle.id);

            expect(rolleResult).toBeDefined();
            expect(rolleResult).toBeInstanceOf(Rolle);
        });

        it('should return undefined if the entity does not exist', async () => {
            const rolle: Option<Rolle<true>> = await sut.findById(faker.string.uuid());

            expect(rolle).toBeNull();
        });
    });

    describe('findByIdAuthorized', () => {
        it('should return the rolle', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            const rolle: Rolle<true> = await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();

            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Result<Rolle<true>> = await sut.findByIdAuthorized(rolle.id, permissions);

            expect(rolleResult.ok).toBeTruthy();
        });

        it('should return error when permissions are insufficient', async () => {
            const rolle: Rolle<true> = await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: faker.string.uuid() }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();

            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);

            const rolleResult: Result<Rolle<true>> = await sut.findByIdAuthorized(rolle.id, permissions);

            expect(rolleResult.ok).toBeFalsy();
        });
    });
    describe('findRollenAuthorized', () => {
        it('should return no rollen because there are none', async () => {
            const organisationId: OrganisationID = faker.string.uuid();

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Option<Rolle<true>[]> = await sut.findRollenAuthorized(permissions, undefined, 10, 0);

            expect(rolleResult?.length).toBe(0);
        });

        it('should return the rollen when permissions are sufficient', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            await sut.save(DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }));

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Option<Rolle<true>[]> = await sut.findRollenAuthorized(permissions, undefined, 10, 0);

            expect(rolleResult?.length).toBe(1);
        });

        it('should return empty array when permissions are insufficient', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            await sut.save(DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }));

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);

            const rolleResult: Option<Rolle<true>[]> = await sut.findRollenAuthorized(permissions, undefined, 10, 0);

            expect(rolleResult?.length).toBe(0);
        });

        it('should filter rollen based on search string and permissions', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId, name: 'Test' }),
            );
            await sut.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisationId,
                    name: 'AnotherName',
                }),
            );

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Option<Rolle<true>[]> = await sut.findRollenAuthorized(permissions, 'Test', 10, 0);

            expect(rolleResult?.length).toBe(1);
        });

        it('should return all rollen when no search string is provided and permissions are sufficient', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            await sut.save(DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }));

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Option<Rolle<true>[]> = await sut.findRollenAuthorized(permissions, undefined, 10, 0);

            expect(rolleResult?.length).toBe(1);
        });
    });
    describe('findByName', () => {
        it('should return the rolle', async () => {
            const rolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));
            const rolleResult: Option<Rolle<true>[]> = await sut.findByName(rolle.name, 1);

            expect(rolleResult).toBeDefined();
            expect(rolleResult).toHaveLength(1);
        });

        it('should return undefined if the entity does not exist', async () => {
            const rolleResult: Option<Rolle<true>[]> = await sut.findByName(faker.string.alpha(), 1);

            expect(rolleResult).toBeDefined();
            expect(rolleResult).toHaveLength(0);
        });
    });

    describe('exists', () => {
        it('should return true, if the rolle exists', async () => {
            const rolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));

            const exists: boolean = await sut.exists(rolle.id);

            expect(exists).toBe(true);
        });

        it('should return false, if the rolle does not exists', async () => {
            const exists: boolean = await sut.exists(faker.string.uuid());

            expect(exists).toBe(false);
        });
    });

    describe('updateRolle', () => {
        it('should return the updated rolle', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            const rolle: Rolle<true> = await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            const newName: string = 'updatedrolle';
            const newMermale: RollenMerkmal[] = [RollenMerkmal.KOPERS_PFLICHT];
            const newSystemrechte: RollenSystemRecht[] = [RollenSystemRecht.PERSONEN_SOFORT_LOESCHEN];
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Rolle<true> | DomainError = await sut.updateRolleAuthorized(
                rolle.id,
                newName,
                newMermale,
                newSystemrechte,
                [],
                false,
                permissions,
            );
            if (rolleResult instanceof DomainError) {
                return;
            }
            expect(rolleResult.id).toBe(rolle.id);
            expect(rolleResult.name).toBe(newName);
            expect(rolleResult.merkmale).toMatchObject(newMermale);
            expect(rolleResult.systemrechte).toMatchObject(newSystemrechte);
            expect(rolleResult.serviceProviderIds).toMatchObject([]);
        });

        it('should return error when permissions are insufficient', async () => {
            const rolle: Rolle<true> = await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: faker.string.uuid() }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);

            const rolleResult: Rolle<true> | DomainError = await sut.updateRolleAuthorized(
                rolle.id,
                faker.company.name(),
                [],
                [],
                [],
                false,
                permissions,
            );

            expect(rolleResult).toBeInstanceOf(DomainError);
        });

        it('should return error when service providers doe not exist', async () => {
            const organisationId: OrganisationID = faker.string.uuid();
            const rolle: Rolle<true> = await sut.save(
                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: organisationId }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

            const rolleResult: Rolle<true> | DomainError = await sut.updateRolleAuthorized(
                rolle.id,
                faker.company.name(),
                [],
                [],
                [faker.string.uuid()],
                false,
                permissions,
            );

            expect(rolleResult).toBeInstanceOf(DomainError);
        });
    });

    describe('deleteAuthorized', () => {
        describe('should succeed', () => {
            it('if rolle HAS Merkmale, Systemrechte & Service Providers', async () => {
                const organisationId: OrganisationID = faker.string.uuid();
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );
                const rolle: Rolle<true> = await sut.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisationId,
                        serviceProviderIds: [serviceProvider.id],
                    }),
                );
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationId]);

                await sut.deleteAuthorized(rolle.id, permissions);

                const exists: boolean = await sut.exists(rolle.id);
                expect(exists).toBe(false);
            });
        });

        describe('should return error', () => {
            it('when permissions are insufficient', async () => {
                const rolle: Rolle<true> = await sut.save(
                    DoFactory.createRolle(false, { administeredBySchulstrukturknoten: faker.string.uuid() }),
                );
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);

                const rolleResult: Option<DomainError> = await sut.deleteAuthorized(rolle.id, permissions);
                expect(rolleResult).toBeInstanceOf(DomainError);
            });
        });
    });
});
