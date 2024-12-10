import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, RequiredEntityData } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
} from '../../../../test/utils/index.js';
import {
    ImportQueryOptions,
    ImportVorgangRepository,
    mapAggregateToData,
    mapEntityToAggregate,
} from './import-vorgang.repository.js';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { ImportVorgangEntity } from './import-vorgang.entity.js';
import { ImportStatus } from '../domain/import.enums.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

describe('ImportVorgangRepository', () => {
    let module: TestingModule;
    let sut: ImportVorgangRepository;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [ImportVorgangRepository],
        }).compile();
        sut = module.get(ImportVorgangRepository);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('mapAggregateToData', () => {
        it('should return ImportVorgang RequiredEntityData', () => {
            const importVorgang: ImportVorgang<true> = ImportVorgang.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.internet.userName(),
                faker.lorem.word(),
                faker.lorem.word(),
                100,
                ImportStatus.STARTED,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );

            const expectedProperties: string[] = [
                'importByUsername',
                'rollename',
                'organisationsname',
                'dataItemCount',
                'status',
                'importByPersonId',
                'rolleId',
                'organisationId',
            ];

            const result: RequiredEntityData<ImportVorgangEntity> = mapAggregateToData(importVorgang);

            expectedProperties.forEach((prop: string) => {
                expect(result).toHaveProperty(prop);
            });
        });
    });

    describe('mapEntityToAggregate', () => {
        it('should return New Aggregate', () => {
            const entiity: ImportVorgangEntity = em.create(
                ImportVorgangEntity,
                mapAggregateToData(DoFactory.createImportVorgang(true)),
            );
            const importVorgang: ImportVorgang<true> = mapEntityToAggregate(entiity);

            expect(importVorgang).toBeInstanceOf(ImportVorgang);
        });
    });

    describe('save', () => {
        it('should create a new ImportVorgang', async () => {
            const importVorgang: ImportVorgang<false> = DoFactory.createImportVorgang(false);

            const result: ImportVorgang<true> = await sut.save(importVorgang);

            expect(result.id).toBeDefined();
        });

        it('should updated an existing ImportVorgang', async () => {
            const importVorgang: ImportVorgang<false> = DoFactory.createImportVorgang(false);
            const createdImportVorgang: ImportVorgang<true> = await sut.save(importVorgang);
            createdImportVorgang.status = ImportStatus.VALID;

            const result: ImportVorgang<true> = await sut.save(createdImportVorgang);

            expect(result.id).toBeDefined();
            expect(result.status).toBe(ImportStatus.VALID);
        });
    });

    describe('findById', () => {
        let importVorgang1: ImportVorgang<false>;
        let entity1: ImportVorgangEntity;

        beforeEach(async () => {
            importVorgang1 = DoFactory.createImportVorgang(false);

            entity1 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang1));
            await em.persistAndFlush([entity1]);
        });

        afterEach(async () => {
            await em.removeAndFlush([entity1]);
        });

        it('should return null if the ImportVorgang does not exist', async () => {
            const result: Option<ImportVorgang<true>> = await sut.findById(faker.string.uuid());

            expect(result).toBeNull();
        });

        it('should return the ImportVorgang', async () => {
            const result: Option<ImportVorgang<true>> = await sut.findById(entity1.id);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ImportVorgang);
        });
    });

    describe('findAuthorized', () => {
        let importVorgang1: ImportVorgang<false>;
        let importVorgang2: ImportVorgang<false>;
        let importVorgang3: ImportVorgang<true>;
        let entity1: ImportVorgangEntity;
        let entity2: ImportVorgangEntity;
        let entity3: ImportVorgangEntity;

        const importByPersonId: string = faker.string.uuid();
        const rolleId: string = faker.string.uuid();
        const orgaId1: string = faker.string.uuid();
        const orgaId2: string = faker.string.uuid();

        beforeEach(async () => {
            importVorgang1 = DoFactory.createImportVorgang(false, {
                importByPersonId: importByPersonId,
                organisationId: orgaId1,
            });
            importVorgang2 = DoFactory.createImportVorgang(false, {
                importByPersonId: importByPersonId,
                rolleId: rolleId,
                organisationId: orgaId2,
            });
            importVorgang3 = DoFactory.createImportVorgang(true, {
                importByPersonId: faker.string.uuid(),
                rolleId: rolleId,
                status: ImportStatus.COMPLETED,
            });

            entity1 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang1));
            entity2 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang2));
            entity3 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang3));
            await em.persistAndFlush([entity1, entity2, entity3]);
        });

        afterEach(async () => {
            await em.removeAndFlush([entity1, entity2, entity3]);
        });

        it('should return empty array when admin des not have IMPORT_DURCHFUEHREN rights', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(
                permissions,
                createMock<ImportQueryOptions>(),
            );

            expect(result).toEqual([]);
            expect(total).toBe(0);
        });

        it('should return import history when search by importByPersonId', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                personId: importByPersonId,
            });

            expect(result.length).toBe(2);
            expect(total).toBe(2);
        });

        it('should return import history when search by rolleIds', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                rolleIds: [rolleId],
            });

            expect(result.length).toBe(2);
            expect(total).toBe(2);
        });

        it('should return import history when search by organisationIds', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                organisationIds: [orgaId1, orgaId2],
            });

            expect(result.length).toBe(2);
            expect(total).toBe(2);
        });

        it('should return import history when search by status', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                status: ImportStatus.COMPLETED,
            });

            expect(result.length).toBe(1);
            expect(total).toBe(1);
        });

        it('should return an empty array if no import transaction was found', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

            const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                status: ImportStatus.FAILED,
            });

            expect(result.length).toBe(0);
            expect(total).toBe(0);
        });
    });
});
