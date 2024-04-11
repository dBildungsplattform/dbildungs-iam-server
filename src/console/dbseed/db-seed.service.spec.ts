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
import { DataProviderFile } from './file/data-provider-file.js';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationRepo } from '../../modules/organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../modules/organisation/domain/organisation.do.js';
import { EntityNotFoundError } from '../../shared/error/index.js';
import { OrganisationsTyp, Traegerschaft } from '../../modules/organisation/domain/organisation.enums.js';
import { faker } from '@faker-js/faker';
import { RolleRepo } from '../../modules/rolle/repo/rolle.repo.js';
import { Rolle } from '../../modules/rolle/domain/rolle.js';
import { RolleFactory } from '../../modules/rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../modules/service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ServiceProviderFactory } from '../../modules/service-provider/domain/service-provider.factory.js';
import { KeycloakUserService } from '../../modules/keycloak-administration/index.js';
import { KeycloakAdministrationService } from '../../modules/keycloak-administration/domain/keycloak-admin-client.service.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakInstanceConfig } from '../../modules/keycloak-administration/keycloak-instance-config.js';

describe('DbSeedService', () => {
    let module: TestingModule;
    let dbSeedService: DbSeedService;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;

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
                RolleFactory,
                ServiceProviderFactory,
                KeycloakUserService,
                KeycloakAdministrationService,
                KeycloakAdminClient,
                KeycloakInstanceConfig.fromConfigService(),
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
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
            ],
        }).compile();
        dbSeedService = module.get(DbSeedService);
        organisationRepoMock = module.get(OrganisationRepo);
        rolleRepoMock = module.get(RolleRepo);
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

    describe('seedRolle', () => {
        describe('with existing organisation for administeredBySchulstrukturknoten', () => {
            it('should insert one entity in database', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/rolle/04_rolle-with-existing-ssk.json`,
                    'utf-8',
                );
                const persistedRolle: Rolle<true> = DoFactory.createRolle(true);

                const fileContentParentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/rolle/00_parent_organisation.json`,
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

                rolleRepoMock.save.mockResolvedValueOnce(persistedRolle);
                await expect(dbSeedService.seedRolle(fileContentAsStr)).resolves.not.toThrow(EntityNotFoundError);
            });
        });

        describe('with non-existing organisation for administeredBySchulstrukturknoten', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/rolle/05_rolle-with-non-existing-ssk.json`,
                    'utf-8',
                );
                const persistedRolle: Rolle<true> = DoFactory.createRolle(true);

                rolleRepoMock.save.mockResolvedValueOnce(persistedRolle);
                await expect(dbSeedService.seedRolle(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });

        describe('with non-existing serviceProvider for in serviceProviderIds', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/rolle/06_rolle-with-non-existing-sp.json`,
                    'utf-8',
                );
                const persistedRolle: Rolle<true> = DoFactory.createRolle(true);

                rolleRepoMock.save.mockResolvedValueOnce(persistedRolle);
                await expect(dbSeedService.seedRolle(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });

    describe('seedServiceProvider', () => {
        describe('seedServiceProvider with two entities', () => {
            it('should not throw an error', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/serviceProvider/03_service-provider.json`,
                    'utf-8',
                );

                const fileContentParentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/serviceProvider/00_parent_organisation.json`,
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

                await expect(dbSeedService.seedServiceProvider(fileContentAsStr)).resolves.not.toThrow(
                    EntityNotFoundError,
                );
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
