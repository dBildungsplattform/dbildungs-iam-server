import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { PersonenkontextController } from './personenkontext.controller.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { FindPersonenkontextByIdParams } from './find-personenkontext-by-id.params.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonDto } from './person.dto.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { HttpException } from '@nestjs/common';

describe('PersonenkontextController', () => {
    let module: TestingModule;
    let sut: PersonenkontextController;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonenkontextController,
                PersonApiMapperProfile,
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

    describe('findPersonenkontextById', () => {
        describe('when finding personenkontext with id', () => {
            it('should return personenkontext response', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };
                const dtoMock: PersonendatensatzDto = {
                    person: new PersonDto(),
                    personenkontexte: [],
                };

                personenkontextUcMock.findPersonenkontextById.mockResolvedValue(dtoMock);

                const response: PersonendatensatzResponse = await sut.findPersonenkontextById(params);

                expect(response).toBeInstanceOf(PersonendatensatzResponse);
                expect(personenkontextUcMock.findPersonenkontextById).toBeCalledTimes(1);
            });
        });

        describe('when NOT finding personenkontext with id', () => {
            it('should throw http error', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextUcMock.findPersonenkontextById.mockRejectedValue(new EntityNotFoundError());

                await expect(sut.findPersonenkontextById(params)).rejects.toThrowError(HttpException);
            });

            it('should throw error', async () => {
                const params: FindPersonenkontextByIdParams = {
                    personenkontextId: faker.string.uuid(),
                };

                personenkontextUcMock.findPersonenkontextById.mockRejectedValue(new Error());

                await expect(sut.findPersonenkontextById(params)).rejects.toThrowError(Error);
            });
        });
    });
});
