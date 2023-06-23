import { Dictionary, Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { fakerDE as faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonAlreadyExistsError } from '../../../shared/index.js';
import { PersonDo } from './person.do.js';
import { PersonEntity } from '../persistence/person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonService } from './person.service.js';

describe('PersonService', () => {
    let module: TestingModule;
    let personService: PersonService;
    let personRepoMock: DeepMocked<PersonRepo>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonService,
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        personService = module.get(PersonService);
        personRepoMock = module.get(PersonRepo);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personService).toBeDefined();
    });

    describe('createPerson', () => {
        describe('when person not exists', () => {
            it('should create user', async () => {
                const person = new PersonEntity();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                personRepoMock.findByReferrer.mockResolvedValue(null);
                personRepoMock.save.mockResolvedValue();
                mapperMock.map.mockReturnValue(person as unknown as Dictionary<unknown>);
                const result = await personService.createPerson({
                    firstName: person.firstName,
                    lastName: person.lastName,
                });
                expect(result).toEqual<Result<PersonDo>>({
                    ok: true,
                    value: new PersonDo(person),
                });
            });
        });

        describe('when person already exists', () => {
            it('should return domain error', async () => {
                const person = new PersonEntity();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                person.referrer = faker.company.name();
                personRepoMock.findByReferrer.mockResolvedValue(person);
                const result = await personService.createPerson({
                    firstName: person.firstName,
                    lastName: person.lastName,
                    referrer: person.referrer,
                });
                expect(result).toEqual<Result<PersonDo>>({
                    ok: false,
                    error: new PersonAlreadyExistsError(`Person with referrer ${person.referrer} already exists`),
                });
            });
        });
    });
});
