import { Test, TestingModule } from '@nestjs/testing';
import { DbSeedService } from './db-seed.service.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { OrganisationFile } from './file/organisation-file.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';

describe('DbSeedService', () => {
    let module: TestingModule;
    let dbSeedService: DbSeedService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                LoggingTestModule,
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: false }),
            ],
            providers: [DbSeedService],
        }).compile();
        dbSeedService = module.get(DbSeedService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(dbSeedService).toBeDefined();
    });

    describe('readDataProvider', () => {
        describe('readDataProvider with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/00_data-provider.json`,
                    'utf-8',
                );
                const entities: DataProviderFile[] = dbSeedService.readDataProvider(fileContentAsStr);
                const entity: DataProviderFile | undefined = entities[0];
                const dataProvider: Partial<DataProviderFile> = {
                    id: '431d8433-759c-4dbe-aaab-00b9a781f467',
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(dataProvider);
            });
        });
    });

    describe('readOrganisation', () => {
        describe('readOrganisation with one entity', () => {
            it('should have length 1 and be mappable', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/01_organisation.json`,
                    'utf-8',
                );
                const entities: OrganisationFile[] = dbSeedService.readOrganisation(fileContentAsStr);
                const entity: OrganisationFile | undefined = entities[0];
                const organisation: Partial<OrganisationFile> = {
                    id: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    typ: OrganisationsTyp.SCHULE,
                    kuerzel: '01',
                    namensergaenzung: 'Keine',
                    name: 'Schule1',
                    kennung: 'Organisation1',
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(organisation);
            });
        });
    });

    describe('readPerson', () => {
        describe('readPerson with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/02_person.json`,
                    'utf-8',
                );
                const entities: PersonEntity[] = dbSeedService.readPerson(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readRolle', () => {
        describe('readRolle with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/04_rolle.json`,
                    'utf-8',
                );
                const rollen: Rolle<true>[] = dbSeedService.readRolle(fileContentAsStr);
                const rolle: Partial<Rolle<true>> = {
                    id: '301457e9-4fe5-42a6-8084-fec927dc00df',
                    name: 'Rolle2222',
                    administeredBySchulstrukturknoten: '1',
                    rollenart: RollenArt.LERN,
                    merkmale: [],
                    createdAt: expect.any(Date) as Date,
                    updatedAt: expect.any(Date) as Date,
                };
                expect(rollen).toHaveLength(1);
                expect(rollen[0]).toEqual(rolle);
            });
        });
    });

    describe('getRolle', () => {
        describe('getRolle by id after loading test rolle', () => {
            it('should return the loaded rolle', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/04_rolle.json`,
                    'utf-8',
                );
                const entities: Rolle<true>[] = dbSeedService.readRolle(fileContentAsStr);
                const entity: Rolle<true> | undefined = entities[0];
                const rolle: Rolle<true> | undefined = dbSeedService.getRolle(entity!.id);
                expect(rolle).toBeTruthy();
            });
        });
    });

    describe('getEntityFileNames', () => {
        describe('getEntityFileNames in directory sql/seeding-integration-test', () => {
            it('should return all files in directory', () => {
                const entityFileNames: string[] = dbSeedService.getEntityFileNames('seeding-integration-test/all');
                expect(entityFileNames).toHaveLength(8);
            });
        });
    });
});
