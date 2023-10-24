import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Rolle } from '../domain/personenkontext.enums.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { PersonenkontextController } from './personenkontext.controller.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonenkontextByIdParams } from './personenkontext-by-id.params.js';

describe('PersonenkontextController', () => {
    let module: TestingModule;
    let sut: PersonenkontextController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextController,
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
            ],
        }).compile();
        sut = module.get(PersonenkontextController);
        personenkontextUcMock = module.get(PersonenkontextUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext response', async () => {
                const params: PersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };
                const responseMock: PersonenkontextResponse = {
                    id: params.personenkontextId,
                    mandant: faker.company.name(),
                    organisation: {
                        id: faker.string.uuid(),
                    },
                    revision: faker.string.numeric(),
                    rolle: Rolle.EXTERNE_PERSON,
                };

                personenkontextUcMock.findById.mockResolvedValue(responseMock);

                const response: PersonenkontextResponse = await sut.findById(params);

                expect(response).toStrictEqual(responseMock);
                expect(personenkontextUcMock.findById).toBeCalledTimes(1);
            });
        });
    });
});
