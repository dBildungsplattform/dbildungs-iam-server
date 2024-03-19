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
import { createMock } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../modules/keycloak-administration/domain/keycloak-user.service.js';
import { PersonRepository } from '../../modules/person/persistence/person.repository.js';
import { PersonFactory } from '../../modules/person/domain/person.factory.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { RolleRepo } from '../../modules/rolle/repo/rolle.repo.js';
//import { DomainError, InvalidNameError, KeycloakClientError } from '../../shared/error/index.js';
import { RolleFactory } from '../../modules/rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../modules/service-provider/repo/service-provider.repo.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UsernameGeneratorService } from '../../modules/person/domain/username-generator.service.js';

describe('DbSeedConsoleMockedKeycloak', () => {
    let module: TestingModule;
    let sut: DbSeedConsole;
    let orm: MikroORM;
    let dbSeedService: DbSeedService;
    /*let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;
    let userNameGeneratorServiceMock: DeepMocked<UsernameGeneratorService>;*/

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
                RolleFactory,
                ServiceProviderRepo,
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
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
            ],
        }).compile();
        sut = module.get(DbSeedConsole);
        orm = module.get(MikroORM);
        dbSeedService = module.get(DbSeedService);
        /*keycloakUserServiceMock = module.get(KeycloakUserService);
        userNameGeneratorServiceMock = module.get(UsernameGeneratorService);*/

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
});
