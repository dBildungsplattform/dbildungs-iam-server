import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../shared/index.js';
import { CreatePersonDto } from './dto/index.js';
import { PersonController } from './person.controller.js';
import { PersonEntity } from './person.entity.js';
import { PersonDo } from './person.do.js';
import { PersonUc } from './person.uc.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

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
            personUcMock.createPerson.mockResolvedValue(new PersonDo(new PersonEntity()));
            const dto: CreatePersonDto = {
                firstName: 'john',
                lastName: 'doe',
            };
            await expect(personController.createPerson(dto)).resolves.not.toThrow();
        });
    });
});
