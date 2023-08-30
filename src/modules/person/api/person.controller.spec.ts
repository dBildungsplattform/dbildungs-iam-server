import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonController } from './person.controller.js';
import { PersonUc } from './person.uc.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonResponse } from './person.response.js';
import { HttpException } from '@nestjs/common';
import { AllPersonsQueryParam, VisibilityType } from './persons-query.param.js';
import { PersonBirthParams } from './person-birth.params.js';
import { TrustLevel } from '../domain/person.enums.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personUcMock: DeepMocked<PersonUc>;
    const mockBirthParams: PersonBirthParams = {
        datum: faker.date.anytime(),
        geburtsort: faker.string.alpha(),
    };

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
                mandant: faker.string.uuid(),
                name: {
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                },
                geburt: {},
            };
            await expect(personController.createPerson(params)).resolves.not.toThrow();
            expect(personUcMock.createPerson).toHaveBeenCalledTimes(1);
        });
    });
    describe('when getting a person', () => {
        const params: PersonByIdParams = {
            personId: faker.string.uuid(),
        };

        it('should get a person', async () => {
            const response: PersonResponse = {
                id: faker.string.uuid(),
                name: {
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                },
                mandant: '',
                referrer: '',
                geburt: mockBirthParams,
                geschlecht: '',
                lokalisierung: '',
                vertrauensstufe: TrustLevel.TRUSTED,
            };
            personUcMock.findPersonById.mockResolvedValue(response);
            await expect(personController.findPersonById(params)).resolves.not.toThrow();
            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });

        it('should throw an Http not found exception', async () => {
            const mockError: Error = new Error('person does not exist.');
            personUcMock.findPersonById.mockRejectedValue(mockError);
            await expect(personController.findPersonById(params)).resolves.toThrow(HttpException);
            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });
    });

    describe('when getting all persons', () => {
        // eslint-disable-next-line @typescript-eslint/typedef
        const options = {
            referrer: faker.string.alpha(),
            lastName: faker.person.lastName(),
            firstName: faker.person.firstName(),
            visibility: VisibilityType.NEIN,
        };
        const queryParams: AllPersonsQueryParam = {
            referrer: options.referrer,
            familyName: options.lastName,
            firstName: options.firstName,
            visibility: options.visibility,
        };

        it('should get all persons', async () => {
            const mockPersonResponse: PersonResponse[] = [
                {
                    id: faker.string.uuid(),
                    name: {
                        familienname: options.lastName,
                        vorname: options.firstName,
                    },
                    mandant: '',
                    referrer: options.referrer,
                    geburt: mockBirthParams,
                    geschlecht: '',
                    lokalisierung: '',
                    vertrauensstufe: TrustLevel.TRUSTED,
                },
                {
                    id: faker.string.uuid(),
                    name: {
                        familienname: options.lastName,
                        vorname: options.firstName,
                    },
                    mandant: '',
                    referrer: options.referrer,
                    geburt: mockBirthParams,
                    geschlecht: '',
                    lokalisierung: '',
                    vertrauensstufe: TrustLevel.TRUSTED,
                },
            ];
            personUcMock.findAll.mockResolvedValue(mockPersonResponse);
            const result: PersonResponse[] = await personController.findPersons(queryParams);
            expect(personUcMock.findAll).toHaveBeenCalledTimes(1);
            expect(result.at(0)?.referrer).toEqual(queryParams.referrer);
            expect(result.at(0)?.name.vorname).toEqual(queryParams.firstName);
            expect(result.at(0)?.name.familienname).toEqual(queryParams.familyName);
            expect(result).toEqual(mockPersonResponse);
        });
    });
});
