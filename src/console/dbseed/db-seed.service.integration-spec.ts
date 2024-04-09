import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    KeycloakConfigTestModule,
    LoggingTestModule,
    MapperTestModule,
} from '../../../test/utils/index.js';
import { DbSeedService } from './db-seed.service.js';
import { DbSeedConsole } from './db-seed.console.js';
import { UsernameGeneratorService } from '../../modules/person/domain/username-generator.service.js';
import { DbSeedMapper } from './db-seed-mapper.js';
import { KeycloakAdministrationModule } from '../../modules/keycloak-administration/keycloak-administration.module.js';
import { RolleRepo } from '../../modules/rolle/repo/rolle.repo.js';
import { KeycloakConfigModule } from '../../modules/keycloak-administration/keycloak-config.module.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { EntityNotFoundError, InvalidAttributeLengthError } from '../../shared/error/index.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import fs from 'fs';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleFactory } from '../../modules/rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../modules/service-provider/repo/service-provider.repo.js';

describe('DbSeedServiceIntegration', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let dbSeedService: DbSeedService;
    //let personFactoryMock: DeepMocked<PersonFactory>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                OrganisationModule,
                KeycloakAdministrationModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LoggingTestModule,
            ],
            providers: [
                DbSeedConsole,
                UsernameGeneratorService,
                DbSeedService,
                DbSeedMapper,
                PersonRepository,
                PersonFactory,
                DBiamPersonenkontextRepo,
                RolleRepo,
                RolleFactory,
                ServiceProviderRepo,
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();
        orm = module.get(MikroORM);
        dbSeedService = module.get(DbSeedService);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
    }, 10000000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(dbSeedService).toBeDefined();
        expect(orm).toBeDefined();
    });

    describe('seedPersonenkontext', () => {
        describe('with non-existing person for personenkontext', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/personenkontext/05_personenkontext.json`,
                    'utf-8',
                );

                await expect(dbSeedService.seedPersonenkontext(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });

        describe('with non-existing organisation for personenkontext', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/personenkontext/05_personenkontext.json`,
                    'utf-8',
                );
                const fileContentPersonAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/personenkontext/02_person.json`,
                    'utf-8',
                );
                await dbSeedService.seedPerson(fileContentPersonAsStr);
                await expect(dbSeedService.seedPersonenkontext(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });

        describe('with non-existing rolle for personenkontext', () => {
            it('should throw EntityNotFoundError', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/personenkontext/05_personenkontext.json`,
                    'utf-8',
                );
                const fileContentOrganisationAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/personenkontext/01_organisation.json`,
                    'utf-8',
                );
                await dbSeedService.seedOrganisation(fileContentOrganisationAsStr);

                await expect(dbSeedService.seedPersonenkontext(fileContentAsStr)).rejects.toThrow(EntityNotFoundError);
            });
        });
    });

    describe('seedPerson', () => {
        describe('when personFactory is failing', () => {
            it('should throw error', async () => {
                const fileContentAsStr: string = fs.readFileSync(
                    `./seeding/seeding-integration-test/invalidPerson/02_person.json`,
                    'utf-8',
                );
                await expect(dbSeedService.seedPerson(fileContentAsStr)).rejects.toThrow(InvalidAttributeLengthError);
            });
        });
    });
});
