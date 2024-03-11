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
import { DbSeedMapper } from './db-seed-mapper.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../modules/keycloak-administration/domain/keycloak-user.service.js';
import { DomainError, KeycloakClientError } from '../../shared/error/index.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/dbiam/dbiam-personenkontext.repo.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { RolleRepo } from '../../modules/rolle/repo/rolle.repo.js';

describe('DbSeedConsoleMockedKeycloak', () => {
    let module: TestingModule;
    let sut: DbSeedConsole;
    let orm: MikroORM;
    let dbSeedService: DbSeedService;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                KeycloakConfigTestModule.forRoot({ isKeycloakRequired: false }),
                OrganisationModule,
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LoggingTestModule,
            ],
            providers: [
                DbSeedConsole,
                DbSeedService,
                DbSeedMapper,
                RolleRepo,
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
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
            ],
        }).compile();
        sut = module.get(DbSeedConsole);
        orm = module.get(MikroORM);
        dbSeedService = module.get(DbSeedService);
        keycloakUserServiceMock = module.get(KeycloakUserService);
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
    }, 100000);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    it('should be defined', () => {
        expect(dbSeedService).toBeDefined();
        expect(orm).toBeDefined();
    });

    describe('run', () => {
        describe('when no parameter for directory is provided', () => {
            it('should fail with error', async () => {
                const params: string[] = ['seeding-integration-test/keycloakError'];
                const error: KeycloakClientError = new KeycloakClientError('An error occurred!');
                const result: Result<string, DomainError> = {
                    ok: false,
                    error: error,
                };
                keycloakUserServiceMock.create.mockResolvedValueOnce(result);
                await expect(sut.run(params)).resolves.not.toThrow();
            });
        });
    });
});
