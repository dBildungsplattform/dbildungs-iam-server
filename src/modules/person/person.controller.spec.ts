import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../shared/index.js';
import { CreatePersonDto } from './dto/index.js';
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
                {
                    provide: PersonUc,
                    useValue: createMock<PersonUc>(),
                },
            ],
        }).compile();
        personUcMock = module.get(PersonUc);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('when creating a person', () => {
        it('should not throw', async () => {
            personUcMock.createPerson.mockRejectedValueOnce({});
            const dto: CreatePersonDto = {
                firstName: 'john',
                lastName: 'doe',
            };
            await expect(personController.createPerson(dto)).resolves.not.toThrow();
        });
    });
});
