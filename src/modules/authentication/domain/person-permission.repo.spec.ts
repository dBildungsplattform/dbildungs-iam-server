import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { PersonPermissionsRepo } from './person-permission.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { PersonPermissions } from './person-permissions.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { KeycloakUserNotFoundError } from './keycloak-user-not-found.error.js';

describe('PersonPermissionRepo', () => {
    let module: TestingModule;
    let sut: PersonPermissionsRepo;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false })],
            providers: [
                PersonPermissionsRepo,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
            ],
        }).compile();

        sut = module.get(PersonPermissionsRepo);
        personRepositoryMock = module.get(PersonRepository);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {});

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('loadPersonPermissions', () => {
        describe('when person can be found', () => {
            it('should load PersonPermissions', async () => {
                const person: Person<true> = Person.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.person.lastName(),
                    faker.person.firstName(),
                    '1',
                    faker.lorem.word(),
                    undefined,
                    faker.string.uuid(),
                );
                personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(person);
                const personPermissions: PersonPermissions = await sut.loadPersonPermissions(faker.string.uuid());
                expect(personPermissions).toBeDefined();
            });
        });

        describe('when person cannot be found', () => {
            it('should throw exception', async () => {
                personRepositoryMock.findByKeycloakUserId.mockResolvedValueOnce(undefined);
                await expect(sut.loadPersonPermissions(faker.string.uuid())).rejects.toThrow(KeycloakUserNotFoundError);
            });
        });
    });
});
