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
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../modules/keycloak-administration/domain/keycloak-user.service.js';
import { DomainError, InvalidNameError, KeycloakClientError } from '../../shared/error/index.js';
import { RolleFactory } from '../../modules/rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../modules/service-provider/repo/service-provider.repo.js';
import { RolleSeedingRepo } from './repo/rolle-seeding.repo.js';

describe('DbSeedConsoleMockedKeycloak', () => {
    let module: TestingModule;
    let sut: DbSeedConsole;
    let orm: MikroORM;
    let dbSeedService: DbSeedService;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;
    let userNameGeneratorServiceMock: DeepMocked<UsernameGeneratorService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                KeycloakConfigTestModule.forRoot({ isKeycloakRequired: false }),
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LoggingTestModule,
            ],
            providers: [
                DbSeedConsole,
                DbSeedService,
                DbSeedMapper,
                RolleSeedingRepo,
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
                RolleFactory,
                ServiceProviderRepo,
            ],
        }).compile();
        sut = module.get(DbSeedConsole);
        orm = module.get(MikroORM);
        dbSeedService = module.get(DbSeedService);

        keycloakUserServiceMock = module.get(KeycloakUserService);
        userNameGeneratorServiceMock = module.get(UsernameGeneratorService);
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
    }, 100000);

    afterAll(async () => {
        await orm.close();
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
                userNameGeneratorServiceMock.generateUsername.mockResolvedValueOnce({ ok: true, value: 'timtester1' });
                await expect(sut.run(params)).rejects.toThrow();
            });
        });

        describe('when no username could be generated', () => {
            it('should fail with error', async () => {
                const params: string[] = ['seeding-integration-test/invalidPerson'];

                userNameGeneratorServiceMock.generateUsername.mockResolvedValueOnce({
                    ok: false,
                    error: new InvalidNameError('invalid'),
                });

                await expect(sut.run(params)).rejects.toThrow(InvalidNameError);
            });
        });
    });
});
