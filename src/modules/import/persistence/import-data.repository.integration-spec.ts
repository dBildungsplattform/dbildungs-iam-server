import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, RequiredEntityData } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
} from '../../../../test/utils/index.js';
import { ImportDataRepository, mapAggregateToData, mapEntityToAggregate } from './import-data.repository.js';
import { ImportDataItemEntity } from './import-data-item.entity.js';
import { ImportDataItem } from '../domain/import-data-item.js';
import { ImportVorgangRepository } from './import-vorgang.repository.js';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ImportDomainError } from '../domain/import-domain.error.js';
import { ImportDataItemStatus } from '../domain/importDataItem.enum.js';

describe('ImportDataRepository', () => {
    let module: TestingModule;
    let sut: ImportDataRepository;
    let importVorgangRepository: ImportVorgangRepository;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [ImportDataRepository, ImportVorgangRepository],
        }).compile();
        sut = module.get(ImportDataRepository);
        importVorgangRepository = module.get(ImportVorgangRepository);
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
        it('should return ImportDataItem RequiredEntityData', () => {
            const importDataItem: ImportDataItem<true> = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.name.lastName(),
                faker.name.firstName(),
                faker.lorem.word(),
                undefined,
            );

            const expectedProperties: string[] = ['importvorgangId', 'nachname', 'vorname', 'klasse', 'personalnummer'];

            const result: RequiredEntityData<ImportDataItemEntity> = mapAggregateToData(importDataItem);

            expectedProperties.forEach((prop: string) => {
                expect(result).toHaveProperty(prop);
            });
        });
    });

    describe('mapEntityToAggregate', () => {
        it('should return New Aggregate', () => {
            const entiity: ImportDataItemEntity = em.create(
                ImportDataItemEntity,
                mapAggregateToData(DoFactory.createImportDataItem(true)),
            );
            const importDataItem: ImportDataItem<true> = mapEntityToAggregate(entiity);

            expect(importDataItem).toBeInstanceOf(ImportDataItem);
        });
    });

    describe('findByImportVorgangId', () => {
        let importDataItem1: ImportDataItem<false>;
        let importDataItem2: ImportDataItem<false>;
        let importDataItem3: ImportDataItem<false>;
        let entity1: ImportDataItemEntity;
        let entity2: ImportDataItemEntity;
        let entity3: ImportDataItemEntity;

        let importvorgangId: string;

        beforeEach(async () => {
            const importvorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );
            importvorgangId = importvorgang.id;

            const importvorgang2: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );

            importDataItem1 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1A',
                undefined,
            );
            importDataItem2 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1B',
                undefined,
            );
            importDataItem3 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgang2.id,
                faker.name.lastName(),
                faker.name.firstName(),
                '1C',
                undefined,
            );
            entity1 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem1));
            entity2 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem2));
            entity3 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem3));
            await em.persistAndFlush([entity1, entity2, entity3]);
        });

        afterEach(async () => {
            await em.removeAndFlush([entity1, entity2, entity3]);
        });

        it('should return importDataItems for the importvorgangId', async () => {
            const [result, total]: [Option<ImportDataItem<true>[]>, number] = await sut.findByImportVorgangId(
                importvorgangId,
                0,
                30,
            );

            expect(result?.length).toBe(2);
            expect(total).toBe(2);
        });
    });

    describe('save', () => {
        it('should create a new importDataItem', async () => {
            const importvorgangId: string = (
                await importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        importByPersonId: undefined,
                        rolleId: undefined,
                        organisationId: undefined,
                    }),
                )
            ).id;
            const importDataItem: ImportDataItem<false> = DoFactory.createImportDataItem(false, { importvorgangId });

            const savedImportDataItem: ImportDataItem<true> = await sut.save(importDataItem);

            expect(savedImportDataItem.id).toBeDefined();
        });

        it('should update an existing importDataItem', async () => {
            const importvorgangId: string = (
                await importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        importByPersonId: undefined,
                        rolleId: undefined,
                        organisationId: undefined,
                    }),
                )
            ).id;
            const createdImportDataItem: ImportDataItem<false> = DoFactory.createImportDataItem(false, {
                importvorgangId,
            });
            createdImportDataItem.status = ImportDataItemStatus.SUCCESS;
            const savedImportDataItem: ImportDataItem<true> = await sut.save(createdImportDataItem);

            savedImportDataItem.nachname = faker.name.lastName();
            savedImportDataItem.vorname = faker.name.firstName();
            savedImportDataItem.klasse = '1A';
            savedImportDataItem.status = ImportDataItemStatus.SUCCESS;

            const result: ImportDataItem<true> = await sut.save(savedImportDataItem);

            expect(result.id).toBeDefined();
            expect(result.nachname).toBe(savedImportDataItem.nachname);
            expect(result.vorname).toBe(savedImportDataItem.vorname);
            expect(result.klasse).toBe(savedImportDataItem.klasse);
            expect(result.nachname).not.toBe(createdImportDataItem.nachname);
            expect(result.vorname).not.toBe(createdImportDataItem.vorname);
            expect(result.klasse).not.toBe(createdImportDataItem.klasse);
        });
    });

    describe('deleteByImportVorgangId', () => {
        let importDataItem1: ImportDataItem<false>;
        let importDataItem2: ImportDataItem<false>;
        let entity1: ImportDataItemEntity;
        let entity2: ImportDataItemEntity;

        let importvorgangId: string;

        beforeEach(async () => {
            importvorgangId = (
                await importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        importByPersonId: undefined,
                        rolleId: undefined,
                        organisationId: undefined,
                    }),
                )
            ).id;

            importDataItem1 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1A',
                undefined,
            );
            importDataItem2 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1B',
                undefined,
            );
            entity1 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem1));
            entity2 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem2));
            await em.persistAndFlush([entity1, entity2]);
        });

        it('should delete all the import data items for the importVorgnagsId', async () => {
            const result: void = await sut.deleteByImportVorgangId(importvorgangId);
            const [findResult, findTotal]: [Option<ImportDataItem<true>[]>, number] =
                await sut.findByImportVorgangId(importvorgangId);

            expect(result).toBeUndefined();
            expect(findResult.length).toBe(0);
            expect(findTotal).toBe(0);
        });
    });

    describe('createAll', () => {
        it('should create all importDataItems', async () => {
            const importvorgangId: string = (
                await importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        importByPersonId: undefined,
                        rolleId: undefined,
                        organisationId: undefined,
                    }),
                )
            ).id;
            const importDataItems: ImportDataItem<false>[] = [
                DoFactory.createImportDataItem(false, { importvorgangId }),
                DoFactory.createImportDataItem(false, { importvorgangId }),
            ];

            const savedImportDataItems: string[] = await sut.createAll(importDataItems);

            expect(
                savedImportDataItems.every((savedImportDataItem: string) => savedImportDataItem !== undefined),
            ).toBeTruthy();
            expect(savedImportDataItems.length).toBe(importDataItems.length);
        });
    });

    describe('replaceAll', () => {
        let importDataItem1: ImportDataItem<true>;
        let importDataItem2: ImportDataItem<true>;
        let importvorgangId: string;

        beforeEach(async () => {
            importvorgangId = (
                await importVorgangRepository.save(
                    DoFactory.createImportVorgang(false, {
                        importByPersonId: undefined,
                        rolleId: undefined,
                        organisationId: undefined,
                    }),
                )
            ).id;
            importDataItem1 = await sut.save(DoFactory.createImportDataItem(false, { importvorgangId }));
            importDataItem2 = await sut.save(DoFactory.createImportDataItem(false, { importvorgangId }));
        });

        it('should replace all when found', async () => {
            const newUsername: string = faker.internet.userName();
            const newUsername2: string = faker.internet.userName();
            const pass1: string = faker.internet.password({ length: 32 });
            const pass2: string = faker.internet.password({ length: 32 });
            const personalnummer: string = faker.random.alphaNumeric(7);

            const updateImportDataItems: ImportDataItem<true>[] = [
                {
                    ...importDataItem1,
                    username: newUsername,
                    password: pass1,
                    personalnummer: personalnummer,
                    validationErrors: [],
                },
                {
                    ...importDataItem2,
                    username: newUsername2,
                    password: pass2,
                    validationErrors: [],
                },
            ];
            const result: ImportDataItem<true>[] = await sut.replaceAll(updateImportDataItems);

            expect(result.length).toBe(2);
            expect(result[0]).toMatchObject({
                id: importDataItem1.id,
                importvorgangId: importvorgangId,
                klasse: importDataItem1.klasse,
                nachname: importDataItem1.nachname,
                vorname: importDataItem1.vorname,
                personalnummer: personalnummer,
                validationErrors: [],
                username: newUsername,
                password: pass1,
            });

            expect(result[1]).toMatchObject({
                id: importDataItem2.id,
                importvorgangId: importvorgangId,
                klasse: importDataItem2.klasse,
                nachname: importDataItem2.nachname,
                vorname: importDataItem2.vorname,
                personalnummer: null,
                validationErrors: [],
                username: newUsername2,
                password: pass2,
            });
        });

        it('should throw an ImportDomainError if one data-item is not found', async () => {
            const updateImportDataItems: ImportDataItem<true>[] = [
                {
                    ...importDataItem1,
                    validationErrors: ['error1'],
                },
                {
                    ...importDataItem2,
                    validationErrors: ['error1'],
                },
                {
                    ...DoFactory.createImportDataItem(true, { importvorgangId }),
                    validationErrors: ['error1'],
                },
            ];

            const importDomainError: DomainError = new ImportDomainError(
                `Update all has failed because not all entities were found. importDataItemsCount:${updateImportDataItems.length}, numberOfEntitiesFound:${2}`,
                'IMPORT_DATA_ITEM_NOT_FOUND',
            );

            await expect(sut.replaceAll(updateImportDataItems)).rejects.toThrowError(importDomainError);
        });
    });

    describe('countProcessedItems', () => {
        let importvorgangId: string;
        let importDataItem1: ImportDataItem<false>;
        let importDataItem2: ImportDataItem<false>;
        let importDataItem3: ImportDataItem<false>;
        let entity1: ImportDataItemEntity;
        let entity2: ImportDataItemEntity;
        let entity3: ImportDataItemEntity;

        beforeEach(async () => {
            // Create a new importvorgang (import process)
            const importvorgang: ImportVorgang<true> = await importVorgangRepository.save(
                DoFactory.createImportVorgang(false, {
                    importByPersonId: undefined,
                    rolleId: undefined,
                    organisationId: undefined,
                }),
            );
            importvorgangId = importvorgang.id;

            // Create import data items
            importDataItem1 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1A',
                undefined,
            );
            importDataItem2 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1B',
                undefined,
            );
            importDataItem3 = ImportDataItem.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                importvorgangId,
                faker.name.lastName(),
                faker.name.firstName(),
                '1C',
                undefined,
            );

            // Create entities and persist them
            entity1 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem1));
            entity2 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem2));
            entity3 = em.create(ImportDataItemEntity, mapAggregateToData(importDataItem3));
            await em.persistAndFlush([entity1, entity2, entity3]);

            // Update the status of some items
            entity1.status = ImportDataItemStatus.SUCCESS;
            entity2.status = ImportDataItemStatus.FAILED;
            entity3.status = ImportDataItemStatus.PENDING; // This will be ignored

            await em.persistAndFlush([entity1, entity2, entity3]);
        });

        afterEach(async () => {
            await em.removeAndFlush([entity1, entity2, entity3]);
        });

        it('should count processed items for the given importvorgangId', async () => {
            // Calling the method to count items with status SUCCESS or FAILED
            const count: number = await sut.countProcessedItems(importvorgangId);

            // Since only entity1 (SUCCESS) and entity2 (FAILED) are processed, count should be 2
            expect(count).toBe(2);
        });

        it('should return 0 if no items have processed status', async () => {
            // Set all items to PENDING status to simulate unprocessed items
            entity1.status = ImportDataItemStatus.PENDING;
            entity2.status = ImportDataItemStatus.PENDING;
            entity3.status = ImportDataItemStatus.PENDING;

            await em.persistAndFlush([entity1, entity2, entity3]);

            const count: number = await sut.countProcessedItems(importvorgangId);

            // Since none of the items are processed, the count should be 0
            expect(count).toBe(0);
        });
    });
});
