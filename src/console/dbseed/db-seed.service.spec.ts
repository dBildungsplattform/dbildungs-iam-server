import { Test, TestingModule } from '@nestjs/testing';
import { DbSeedService } from './db-seed.service.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { ServiceProviderEntity } from '../../modules/rolle/entity/service-provider.entity.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';
import { RolleEntity } from '../../modules/rolle/entity/rolle.entity.js';
import { ServiceProviderZugriffEntity } from '../../modules/rolle/entity/service-provider-zugriff.entity.js';
import { PersonRollenZuweisungEntity } from '../../modules/rolle/entity/person-rollen-zuweisung.entity.js';
import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enum.js';
import { OrganisationFile } from './file/organisation-file.js';

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
                const fileContentAsStr: string = fs.readFileSync(`./sql/testdata/all/00_data-provider.json`, 'utf-8');
                const entities: DataProviderEntity[] = dbSeedService.readDataProvider(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readServiceProvider', () => {
        describe('readServiceProvider with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/testdata/all/03_service-provider.json`,
                    'utf-8',
                );
                const entities: ServiceProviderEntity[] = dbSeedService.readServiceProvider(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readOrganisation', () => {
        describe('readOrganisation with one entity', () => {
            it('should have length 1 and be mappable', () => {
                const fileContentAsStr: string = fs.readFileSync(`./sql/testdata/all/01_organisation.json`, 'utf-8');
                const entities: OrganisationFile[] = dbSeedService.readOrganisation(fileContentAsStr);
                const entity: OrganisationFile | undefined = entities[0];
                const organisation: Partial<OrganisationFile> = {
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
                const fileContentAsStr: string = fs.readFileSync(`./sql/testdata/all/02_person.json`, 'utf-8');
                const entities: PersonEntity[] = dbSeedService.readPerson(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readRolle', () => {
        describe('readRolle with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(`./sql/testdata/all/04_rolle.json`, 'utf-8');
                const entities: RolleEntity[] = dbSeedService.readRolle(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readServiceProviderZugriff', () => {
        describe('readServiceProviderZugriff with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/testdata/all/06_service-provider-zugriff.json`,
                    'utf-8',
                );
                const entities: ServiceProviderZugriffEntity[] =
                    dbSeedService.readServiceProviderZugriff(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('readPersonRollenZuweisung', () => {
        describe('readPersonRollenZuweisung with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/testdata/all/05_person-rollen-zuweisung.json`,
                    'utf-8',
                );
                const entities: PersonRollenZuweisungEntity[] =
                    dbSeedService.readPersonRollenZuweisung(fileContentAsStr);
                expect(entities).toHaveLength(1);
            });
        });
    });

    describe('getRolle', () => {
        describe('getRolle by id after loading test rolle', () => {
            it('should return the loaded rolle', () => {
                const fileContentAsStr: string = fs.readFileSync(`./sql/testdata/all/04_rolle.json`, 'utf-8');
                const entities: RolleEntity[] = dbSeedService.readRolle(fileContentAsStr);
                const entity: RolleEntity | undefined = entities[0];
                const rolle: RolleEntity | undefined = dbSeedService.getRolle(entity!.id);
                expect(rolle).toBeTruthy();
            });
        });
    });

    describe('getEntityFileNames', () => {
        describe('getEntityFileNames in directory sql/testdata', () => {
            it('should return all files in directory', () => {
                const entityFileNames: string[] = dbSeedService.getEntityFileNames('testdata/all');
                expect(entityFileNames).toHaveLength(8);
            });
        });
    });
});
