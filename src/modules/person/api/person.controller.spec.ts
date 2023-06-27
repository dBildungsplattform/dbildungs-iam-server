import { fakerDE as faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../shared/testing/index.js';
import { CreatePersonBodyParams } from '../api/create-person.body.params.js';
import { PersonController } from './person.controller.js';
import { PersonUc } from '../api/person.uc.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonMapperProfile } from '../person.mapper.profile.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personUcMock: DeepMocked<PersonUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonController,
                PersonMapperProfile,
                {
                    provide: PersonUc,
                    useValue: createMock<PersonUc>(),
                },
            ],
        }).compile();
        personController = module.get(PersonController);
        personUcMock = module.get(PersonUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(personController).toBeDefined();
    });

    describe('when creating a person', () => {
        it('should not throw', async () => {
            personUcMock.createPerson.mockResolvedValue(new PersonDo());
            const params: CreatePersonBodyParams = {
                name: {
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                },
                birth: {},
            };
            await expect(personController.createPerson(params)).resolves.not.toThrow();
        });
    });
});
