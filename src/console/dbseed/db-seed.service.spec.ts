import { Test, TestingModule } from '@nestjs/testing';
import { DbSeedService } from './db-seed.service.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { ServiceProviderEntity } from '../../modules/service-provider/entity/service-provider.entity.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { ServiceProviderZugriffEntity } from '../../modules/service-provider/entity/service-provider-zugriff.entity.js';
import { OrganisationFile } from './file/organisation-file.js';
import { ServiceProviderZugriffFile } from './file/service-provider-zugriff-file.js';
import { PersonRollenZuweisungFile } from './file/person-rollen-zuweisung-file.js';
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

    describe('readServiceProvider', () => {
        describe('readServiceProvider with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/03_service-provider.json`,
                    'utf-8',
                );
                const entities: ServiceProviderEntity[] = dbSeedService.readServiceProvider(fileContentAsStr);
                const entity: ServiceProviderEntity | undefined = entities[0];
                const serviceProvider: Partial<ServiceProviderEntity> = {
                    id: 'af314073-539c-45ed-b94a-a2e1b9c976e3',
                    name: 'Email',
                    url: 'https://de.wikipedia.org/wiki/E-Mail',
                    providedOnSchulstrukturknoten: '1',
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(serviceProvider);
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

    describe('readServiceProviderZugriff', () => {
        describe('readServiceProviderZugriff with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/06_service-provider-zugriff.json`,
                    'utf-8',
                );
                const entities: ServiceProviderZugriffEntity[] =
                    dbSeedService.readServiceProviderZugriff(fileContentAsStr);
                const entity: ServiceProviderZugriffFile | undefined = entities[0];
                const spz: Partial<ServiceProviderZugriffFile> = {
                    id: '0e23c772-07b3-4d40-a71c-71848712fb96',
                    serviceProvider: 'af314073-539c-45ed-b94a-a2e1b9c976e3',
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(spz);
            });
        });
    });

    describe('readPersonRollenZuweisung', () => {
        describe('readPersonRollenZuweisung with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/05_person-rollen-zuweisung.json`,
                    'utf-8',
                );
                const entities: PersonRollenZuweisungFile[] = dbSeedService.readPersonRollenZuweisung(fileContentAsStr);
                const entity: PersonRollenZuweisungFile | undefined = entities[0];
                const prz: Partial<PersonRollenZuweisungFile> = {
                    id: '27ff7c36-35ea-4fcb-9faa-ed7794afaece',
                    person: '1850aef4-a771-40fd-8e84-3de483007bfa',
                    rolleReference: {
                        id: 'd5732e12-5bca-4ef0-826b-3e910fcc7fd3',
                        persisted: true,
                    },
                    schulstrukturknoten: '1',
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(prz);
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
