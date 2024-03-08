import { Test, TestingModule } from '@nestjs/testing';
import { DbSeedService } from './db-seed.service.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { OrganisationFile } from './file/organisation-file.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { OrganisationsTyp, Traegerschaft } from '../../modules/organisation/domain/organisation.enums.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { ServiceProviderKategorie } from '../../modules/service-provider/domain/service-provider.enum.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { Buffer } from 'buffer';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { createMock } from '@golevelup/ts-jest';

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
            providers: [
                DbSeedService,
                {
                    provide: PersonFactory,
                    useValue: createMock<PersonFactory>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
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
        describe('readOrganisation with one entity and properties defined', () => {
            it('should have length 1 and be mappable', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/01_organisation.json`,
                    'utf-8',
                );
                const entities: OrganisationFile[] = dbSeedService.readOrganisation(fileContentAsStr);
                const entity: OrganisationFile | undefined = entities[0];
                const organisation: Partial<OrganisationFile> = {
                    id: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    administriertVon: undefined,
                    zugehoerigZu: undefined,
                    typ: OrganisationsTyp.SCHULE,
                    kuerzel: '01',
                    namensergaenzung: 'Keine',
                    name: 'Schule1',
                    kennung: 'Organisation1',
                    traegerschaft: Traegerschaft.KIRCHLICH,
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(organisation);
            });
        });
        describe('readOrganisation with one entity and optional properties are undefined', () => {
            it('should have length 1 and be mappable', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/organisationUndefinedProperties/01_organisation.json`,
                    'utf-8',
                );
                const entities: OrganisationFile[] = dbSeedService.readOrganisation(fileContentAsStr);
                const entity: OrganisationFile | undefined = entities[0];
                const organisation: Partial<OrganisationFile> = {
                    id: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    administriertVon: undefined,
                    zugehoerigZu: undefined,
                    typ: undefined,
                    kuerzel: undefined,
                    namensergaenzung: undefined,
                    name: undefined,
                    kennung: undefined,
                    traegerschaft: undefined,
                };
                expect(entities).toHaveLength(1);
                expect(entity).toEqual(organisation);
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
                    administeredBySchulstrukturknoten: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    rollenart: RollenArt.LERN,
                    merkmale: [],
                    systemrechte: [],
                    createdAt: expect.any(Date) as Date,
                    updatedAt: expect.any(Date) as Date,
                };
                expect(rollen).toHaveLength(1);
                expect(rollen[0]).toEqual(rolle);
            });
        });
    });

    describe('readServiceProvider', () => {
        describe('readServiceProvider with two entities', () => {
            it('should have length 2', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/03_service-provider.json`,
                    'utf-8',
                );

                const serviceprovider: ServiceProvider<true>[] = dbSeedService.readServiceProvider(fileContentAsStr);

                expect(serviceprovider).toHaveLength(2);
                expect(serviceprovider[0]).toEqual({
                    id: 'ca0e17c5-8e48-403b-af92-28eff21c64bb',
                    name: 'Provider With Logo',
                    url: 'https://example.com/',
                    kategorie: ServiceProviderKategorie.UNTERRICHT,
                    logoMimeType: 'image/png',
                    logo: expect.any(Buffer) as Buffer,
                    providedOnSchulstrukturknoten: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    createdAt: expect.any(Date) as Date,
                    updatedAt: expect.any(Date) as Date,
                });
                expect(serviceprovider[1]).toEqual({
                    id: 'd96ddc00-a8ed-4d4c-b498-24958fb64604',
                    name: 'Provider Without Logo',
                    url: 'https://example.com/',
                    kategorie: ServiceProviderKategorie.UNTERRICHT,
                    logo: undefined,
                    logoMimeType: undefined,
                    providedOnSchulstrukturknoten: 'cb3e7c7f-c8fb-4083-acbf-2484efb19b54',
                    createdAt: expect.any(Date) as Date,
                    updatedAt: expect.any(Date) as Date,
                });
            });
        });
    });

    describe('readPersonenkontext', () => {
        describe('readPersonenkontext with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./sql/seeding-integration-test/all/05_personenkontext.json`,
                    'utf-8',
                );
                const personenkontexte: Personenkontext<true>[] = dbSeedService.readPersonenkontext(fileContentAsStr);

                expect(personenkontexte).toHaveLength(1);
                expect(personenkontexte[0]).toEqual({
                    id: 'a6cf487d-3b69-4105-bb4d-a022c2e1c67a',
                    personId: 'ee510860-261a-4896-9d02-95d94d73c9f7',
                    organisationId: 'bcc7ec17-37d5-4ec9-9129-c14bcfa53cd6',
                    rolleId: 'abdcc2b9-5086-4bf2-bbee-03d6a013b7f8',
                    createdAt: expect.any(Date) as Date,
                    updatedAt: expect.any(Date) as Date,
                });
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
                expect(entityFileNames).toHaveLength(7);
            });
        });
    });
});
