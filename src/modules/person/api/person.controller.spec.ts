import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonController } from './person.controller.js';
import { PersonUc } from './person.uc.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personUcMock: DeepMocked<PersonUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonController,
                PersonApiMapperProfile,
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
            personUcMock.createPerson.mockResolvedValue();
            const params: CreatePersonBodyParams = {
                client: faker.string.uuid(),
                name: {
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                },
                birth: {},
            };
            await expect(personController.createPerson(params)).resolves.not.toThrow();
            expect(personUcMock.createPerson).toHaveBeenCalledTimes(1);
        });
    });
});
