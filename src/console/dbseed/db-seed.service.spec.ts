import { Test, TestingModule } from '@nestjs/testing';
import { DbSeedService } from './db-seed.service.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { DataProviderFile } from './file/data-provider-file.js';
import { RollenArt } from '../../modules/rolle/domain/rolle.enums.js';
import { ServiceProvider } from '../../modules/service-provider/domain/service-provider.js';
import { ServiceProviderKategorie } from '../../modules/service-provider/domain/service-provider.enum.js';
import { Buffer } from 'buffer';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/dbiam/dbiam-personenkontext.repo.js';
import { OrganisationRepo } from '../../modules/organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../modules/organisation/domain/organisation.do.js';
import { EntityNotFoundError } from '../../shared/error/index.js';
import { OrganisationsTyp, Traegerschaft } from '../../modules/organisation/domain/organisation.enums.js';
import { faker } from '@faker-js/faker';

describe('DbSeedService', () => {
    let module: TestingModule;
    let dbSeedService: DbSeedService;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;

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
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
            ],
        }).compile();
        dbSeedService = module.get(DbSeedService);
        organisationRepoMock = module.get(OrganisationRepo);
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
                    `./seeding/seeding-integration-test/all/00_data-provider.json`,
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

    describe('seedOrganisation', () => {
        describe('without administriertVon and zugehoerigZu', () => {
            it('should insert one entity in database', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/all/01_organisation.json`,
                    'utf-8',
                );
                const persistedOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);

                organisationRepoMock.save.mockResolvedValueOnce(persistedOrganisation);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).resolves.not.toThrow(
                    EntityNotFoundError,
                );
            });
        });

        describe('with only nulls', () => {
            it('should insert one entity in database', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/00_organisation_with_only_nulls.json`,
                    'utf-8',
                );
                const persistedOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);

                organisationRepoMock.save.mockResolvedValueOnce(persistedOrganisation);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).resolves.not.toThrow(
                    EntityNotFoundError,
                );
            });
        });

        describe('with existing administriertVon', () => {
            it('should not throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/01_organisation.json`,
                    'utf-8',
                );
                const fileContentParentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/03_parent_organisation.json`,
                    'utf-8',
                );
                const parent: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    id: faker.string.uuid(),
                    kennung: 'ParentOrganisation',
                    name: 'Parent',
                    namensergaenzung: 'Keine',
                    kuerzel: '00',
                    typ: OrganisationsTyp.TRAEGER,
                    traegerschaft: Traegerschaft.KIRCHLICH,
                });
                organisationRepoMock.save.mockResolvedValueOnce(parent);
                await dbSeedService.seedOrganisation(fileContentParentAsStr);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).resolves.not.toThrow(
                    EntityNotFoundError,
                );
            });
        });

        describe('with existing zugehoerigZu', () => {
            it('should not throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/02_organisation.json`,
                    'utf-8',
                );
                const fileContentParentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/03_parent_organisation.json`,
                    'utf-8',
                );
                const parent: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    id: faker.string.uuid(),
                    kennung: 'ParentOrganisation',
                    name: 'Parent',
                    namensergaenzung: 'Keine',
                    kuerzel: '00',
                    typ: OrganisationsTyp.TRAEGER,
                    traegerschaft: Traegerschaft.KIRCHLICH,
                });
                organisationRepoMock.save.mockResolvedValueOnce(parent);
                await dbSeedService.seedOrganisation(fileContentParentAsStr);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).resolves.not.toThrow(
                    EntityNotFoundError,
                );
            });
        });

        describe('with non existing administriertVon', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/04_missing_administriert-von.json`,
                    'utf-8',
                );
                const persistedOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);

                organisationRepoMock.save.mockResolvedValueOnce(persistedOrganisation);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });

        describe('with non existing zugehoerigZu', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/organisation/05_missing_zugehoerig-zu.json`,
                    'utf-8',
                );
                const persistedOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);

                organisationRepoMock.save.mockResolvedValueOnce(persistedOrganisation);
                await expect(dbSeedService.seedOrganisation(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });

    describe('readRolle', () => {
        describe('readRolle with one entity', () => {
            it('should have length 1', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/all/04_rolle.json`,
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
                    `./seeding/seeding-integration-test/all/03_service-provider.json`,
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

    describe('getRolle', () => {
        describe('getRolle by id after loading test rolle', () => {
            it('should return the loaded rolle', () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/all/04_rolle.json`,
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
