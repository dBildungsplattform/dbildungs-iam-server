import { fakerDE as faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainError, MapperTestModule, PersonAlreadyExistsError } from '../../shared/index.js';
import { PersonDo } from './person.do.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonService } from './person.service.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

describe('PersonService', () => {
    let module: TestingModule;
    let personService: PersonService;
    let personRepoMock: DeepMocked<PersonRepo>;
    const personMock: Partial<PersonEntity> = {
        id: faker.string.uuid(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        referrer: faker.string.uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonMapperProfile,
                PersonService,
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
            ],
        }).compile();
        personService = module.get(PersonService);
        personRepoMock = module.get(PersonRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('when person not exists', () => {
        it('should create user', async () => {
            personRepoMock.findByReferrer.mockResolvedValue(null);
            const result = await personService.createPerson({
                firstName: personMock?.firstName as string,
                lastName: personMock?.lastName as string,
            });
            expect(result).toEqual<Result<PersonDo, DomainError>>({
                ok: true,
                value: new PersonDo(personMock as PersonEntity),
            });
        });
    });

    describe('when person already exists', () => {
        it('should return domain error', async () => {
            personRepoMock.findByReferrer.mockResolvedValue(personMock as PersonEntity);
            const result = await personService.createPerson({
                firstName: personMock.firstName as string,
                lastName: personMock.lastName as string,
                referrer: personMock.referrer as string,
            });
            expect(result).toEqual<Result<PersonDo, DomainError>>({
                ok: false,
                error: new PersonAlreadyExistsError(
                    `Person with referrer ${personMock.referrer as string} already exists`,
                ),
            });
        });
    });
});
