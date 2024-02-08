import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { PagedResponse } from '../../../shared/paging/index.js';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';
import { SichtfreigabeType } from '../../person-kontext/domain/personenkontext.enums.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonDto } from './person.dto.js';
import { PersonFrontendController } from './person.frontend.controller.js';
import { PersonUc } from './person.uc.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';

describe('PersonFrontendController', () => {
    let module: TestingModule;
    let personController: PersonFrontendController;
    let personUcMock: DeepMocked<PersonUc>;
    const mockBirthParams: PersonBirthParams = {
        datum: faker.date.anytime(),
        geburtsort: faker.string.alpha(),
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                PersonFrontendController,
                PersonApiMapperProfile,
                {
                    provide: PersonUc,
                    useValue: createMock<PersonUc>(),
                },
            ],
        }).compile();
        personController = module.get(PersonFrontendController);
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
            sichtfreigabe: SichtfreigabeType.NEIN,
        };

        it('should get all persons', async () => {
            const person1: PersonDto = {
                id: faker.string.uuid(),
                name: {
                    familienname: options.lastName,
                    vorname: options.firstName,
                },
                referrer: options.referrer,
                geburt: mockBirthParams,
                geschlecht: Geschlecht.M,
                lokalisierung: '',
                vertrauensstufe: Vertrauensstufe.VOLL,
            } as PersonDto;
            const person2: PersonDto = {
                id: faker.string.uuid(),
                name: {
                    familienname: options.lastName,
                    vorname: options.firstName,
                },
                referrer: options.referrer,
                geburt: mockBirthParams,
                geschlecht: Geschlecht.M,
                lokalisierung: '',
                vertrauensstufe: Vertrauensstufe.VOLL,
            } as PersonDto;

            const mockPersondatensatz1: PersonendatensatzDto = {
                person: person1,
                personenkontexte: [],
            };
            const mockPersondatensatz2: PersonendatensatzDto = {
                person: person2,
                personenkontexte: [],
            };
            const mockPersondatensatz: PagedResponse<PersonendatensatzDto> = new PagedResponse({
                offset: 0,
                limit: 10,
                total: 2,
                items: [mockPersondatensatz1, mockPersondatensatz2],
            });

            personUcMock.findAll.mockResolvedValue(mockPersondatensatz);

            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(queryParams);

            expect(personUcMock.findAll).toHaveBeenCalledTimes(1);
            expect(result.items.at(0)?.person.referrer).toEqual(queryParams.referrer);
            expect(result.items.at(0)?.person.name.vorname).toEqual(queryParams.vorname);
            expect(result.items.at(0)?.person.name.familienname).toEqual(queryParams.familienname);
            expect(result).toEqual(mockPersondatensatz);
        });
    });
});
