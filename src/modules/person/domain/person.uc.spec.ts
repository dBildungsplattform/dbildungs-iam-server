import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonRepository } from '../persistence/person.repository.js';
import { PersonUc } from './person.uc.js';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Person } from './person.js';
import { ConfigTestModule } from '../../../../test/utils/index.js';
import { DataConfig } from '../../../shared/config/index.js';

describe('PersonUc', () => {
    let module: TestingModule;
    let personUc: PersonUc;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personPermissionsMock: DeepMocked<PersonPermissions>;
    let configService: ConfigService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                PersonUc,
                ConfigService,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        personUc = module.get(PersonUc);
        personRepositoryMock = module.get(PersonRepository);
        personPermissionsMock = createMock<PersonPermissions>();
        configService = module.get(ConfigService);
    });

    function getPerson(): Person<true> {
        return Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );
    }

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personUc).toBeDefined();
    });

    describe('getPersonIfAllowed', () => {
        describe('when person is found on any same organisations like the affected person', () => {
            it('should return person', async () => {
                const requestPerson: Person<true> = getPerson();
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([requestPerson.id]);
                const mockedResponse: Counted<Person<true>> = [[requestPerson], 1];
                personRepositoryMock.findBy.mockResolvedValueOnce(mockedResponse);
                const result: Result<Person<true>> = await personUc.getPersonIfAllowed(
                    requestPerson.id,
                    personPermissionsMock,
                );

                expect(result.ok).toBeTruthy();
            });
        });

        describe('when person is not on any same organisations like the affected person', () => {
            it('should return EntityNotFoundError', async () => {
                const requestPerson: Person<true> = getPerson();
                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([requestPerson.id]);
                const mockedResponse: Counted<Person<true>> = [
                    [
                        getPerson(), //find another person only for non-matching
                    ],
                    1,
                ];
                personRepositoryMock.findBy.mockResolvedValueOnce(mockedResponse);
                const result: Result<Person<true>> = await personUc.getPersonIfAllowed(
                    requestPerson.id,
                    personPermissionsMock,
                );

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when user has permission on root organisation', () => {
            it('should return person', async () => {
                const requestPerson: Person<true> = getPerson();
                const fakeOrganisationId: string = configService.getOrThrow<DataConfig>('DATA').ROOT_ORGANISATION_ID;

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce([fakeOrganisationId]);
                const mockedResponse: Counted<Person<true>> = [[requestPerson], 1];
                personRepositoryMock.findBy.mockResolvedValueOnce(mockedResponse);
                const result: Result<Person<true>> = await personUc.getPersonIfAllowed(
                    requestPerson.id,
                    personPermissionsMock,
                );

                expect(result.ok).toBeTruthy();
            });
        });
    });
});
