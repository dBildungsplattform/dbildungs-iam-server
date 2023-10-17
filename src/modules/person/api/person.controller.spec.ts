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
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonBirthParams } from './person-birth.params.js';
import { TrustLevel } from '../domain/person.enums.js';
import { PersonenDatensatz } from './personendatensatz.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { CreatePersonenkontextBodyParams } from './create-personenkontext.body.params.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { Jahrgangsstufe, Personenstatus, Rolle } from '../domain/personenkontext.enums.js';
import { PagedResponse } from '../../../shared/paging/index.js';

describe('PersonController', () => {
    let module: TestingModule;
    let personController: PersonController;
    let personUcMock: DeepMocked<PersonUc>;
    let personenkontextUcMock: DeepMocked<PersonenkontextUc>;
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
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
            ],
        }).compile();
        personController = module.get(PersonController);
        personUcMock = module.get(PersonUc);
        personenkontextUcMock = module.get(PersonenkontextUc);
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
                username: faker.internet.userName(),
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
            const personResponse: PersonResponse = {
                id: faker.string.uuid(),
                name: {
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    initialenfamilienname: faker.person.lastName(),
                    initialenvorname: faker.person.firstName(),
                    rufname: faker.person.middleName(),
                    title: faker.string.alpha(),
                    anrede: [faker.string.alpha(), faker.string.alpha()],
                    namenssuffix: [],
                    namenspraefix: [],
                    sortierindex: 'sortierindex',
                },
                mandant: faker.string.uuid(),
                referrer: faker.string.uuid(),
                geburt: {
                    datum: new Date('2022.02.02'),
                    geburtsort: faker.location.country(),
                },
                geschlecht: faker.person.gender(),
                lokalisierung: faker.location.country(),
                vertrauensstufe: TrustLevel.TRUSTED,
            };
            const persondatensatz: PersonenDatensatz = {
                person: personResponse,
            };
            personUcMock.findPersonById.mockResolvedValue(persondatensatz);
            await expect(personController.findPersonById(params)).resolves.not.toThrow();
            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });

        it('should throw an Http not found exception', async () => {
            const mockError: Error = new Error('person does not exist.');
            personUcMock.findPersonById.mockRejectedValue(mockError);
            await expect(personController.findPersonById(params)).rejects.toThrowError(HttpException);
            expect(personUcMock.findPersonById).toHaveBeenCalledTimes(1);
        });
    });

    describe('findPersons', () => {
        const options: {
            referrer: string;
            lastName: string;
            firstName: string;
        } = {
            referrer: faker.string.alpha(),
            lastName: faker.person.lastName(),
            firstName: faker.person.firstName(),
        };
        const queryParams: PersonenQueryParams = {
            referrer: options.referrer,
            familienname: options.lastName,
            vorname: options.firstName,
        };

        it('should get all persons', async () => {
            const person1: PersonResponse = {
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
            };
            const person2: PersonResponse = {
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
            };
            const mockPersondatensatz1: PersonenDatensatz = {
                person: person1,
            };
            const mockPersondatensatz2: PersonenDatensatz = {
                person: person2,
            };
            const mockPersondatensatz: PagedResponse<PersonenDatensatz> = new PagedResponse({
                offset: 0,
                limit: 10,
                total: 2,
                items: [mockPersondatensatz1, mockPersondatensatz2],
            });

            personUcMock.findAll.mockResolvedValue(mockPersondatensatz);

            const result: PagedResponse<PersonenDatensatz> = await personController.findPersons(queryParams);

            expect(personUcMock.findAll).toHaveBeenCalledTimes(1);
            expect(result.items.at(0)?.person.referrer).toEqual(queryParams.referrer);
            expect(result.items.at(0)?.person.name.vorname).toEqual(queryParams.vorname);
            expect(result.items.at(0)?.person.name.familienname).toEqual(queryParams.familienname);
            expect(result).toEqual(mockPersondatensatz);
        });
    });

    describe('when creating a personenkontext', () => {
        it('should not throw', async () => {
            const pathParams: PersonByIdParams = {
                personId: faker.string.uuid(),
            };
            const body: CreatePersonenkontextBodyParams = {
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
            };
            const ucResult: CreatedPersonenkontextDto = {
                id: faker.string.uuid(),
                mandant: faker.string.uuid(),
                organisation: {
                    id: faker.string.uuid(),
                },
                revision: '1',
                rolle: Rolle.LEHRENDER,
                jahrgangsstufe: Jahrgangsstufe.JAHRGANGSSTUFE_1,
                personenstatus: Personenstatus.AKTIV,
                referrer: 'referrer',
            };
            personenkontextUcMock.createPersonenkontext.mockResolvedValue(ucResult);

            await expect(personController.createPersonenkontext(pathParams, body)).resolves.not.toThrow();
            expect(personenkontextUcMock.createPersonenkontext).toHaveBeenCalledTimes(1);
        });
    });
});
