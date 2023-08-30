import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError, PersonAlreadyExistsError } from '../../../shared/error/index.js';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonUc } from './person.uc.js';
import { FindPersonDTO } from './find-person.dto.js';
import { faker } from '@faker-js/faker';
import { PersonDo } from '../domain/person.do.js';
import { PersonResponse } from './person.response.js';

describe('PersonUc', () => {
    let module: TestingModule;
    let personUc: PersonUc;
    let personServiceMock: DeepMocked<PersonService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonUc,
                PersonApiMapperProfile,
                {
                    provide: PersonService,
                    useValue: createMock<PersonService>(),
                },
            ],
        }).compile();
        personUc = module.get(PersonUc);
        personServiceMock = module.get(PersonService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personUc).toBeDefined();
    });

    describe('createPerson', () => {
        describe('when person not exists', () => {
            it('should create a new person', async () => {
                personServiceMock.createPerson.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createPerson(true),
                });
                await expect(personUc.createPerson({} as CreatePersonDto)).resolves.not.toThrow();
            });
        });

        describe('when person already exists', () => {
            it('should throw PersonAlreadyExistsError', async () => {
                personServiceMock.createPerson.mockResolvedValue({
                    ok: false,
                    error: new PersonAlreadyExistsError(''),
                });
                await expect(personUc.createPerson({} as CreatePersonDto)).rejects.toThrowError(
                    PersonAlreadyExistsError,
                );
            });
        });
    });

    describe('findPersonById', () => {
        const id: string = faker.string.uuid();

        describe('when person exists', () => {
            it('should find a person by an ID', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createPerson(true),
                });
                await expect(personUc.findPersonById(id)).resolves.not.toThrow();
            });
        });

        describe('when person does not exist', () => {
            it('should throw a person does not exist exception', async () => {
                personServiceMock.findPersonById.mockResolvedValue({
                    ok: false,
                    error: new EntityNotFoundError(''),
                });
                await expect(personUc.findPersonById(id)).rejects.toThrowError(EntityNotFoundError);
            });
        });
    });

    describe('findAll', () => {
        const personDTO: FindPersonDTO = {
            referrer: '',
            familyName: '',
            firstName: '',
            visibility: false,
        };
        describe('when person exists', () => {
            it('should find all persons that match with query param', async () => {
                const firstPerson: PersonDo<true> = DoFactory.createPerson(true);
                const secondPerson: PersonDo<true> = DoFactory.createPerson(true);
                const persons: PersonDo<true>[] = [];
                persons.push(firstPerson);
                persons.push(secondPerson);
                personServiceMock.findAllPersons.mockResolvedValue(persons as Option<PersonDo<true>>[]);
                const result: PersonResponse[] = await personUc.findAll(personDTO);
                expect(result).toHaveLength(2);
                expect(result.at(0)?.name.vorname).toEqual(persons.at(0)?.firstName);
                expect(result.at(0)?.name.familienname).toEqual(persons.at(0)?.lastName);
            });
        });
    });
});
