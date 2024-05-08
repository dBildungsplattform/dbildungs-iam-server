import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { PersonApiMapperProfile } from './person-api.mapper.profile.js';
import { PersonFrontendController } from './person.frontend.controller.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { Person } from '../domain/person.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { PagedResponse } from '../../../shared/paging/index.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { UnauthorizedException } from '@nestjs/common';

describe('PersonFrontendController', () => {
    let module: TestingModule;
    let personController: PersonFrontendController;
    let personRepositoryMock: DeepMocked<PersonRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule],
            providers: [
                PersonFrontendController,
                PersonApiMapperProfile,
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        personController = module.get(PersonFrontendController);
        personRepositoryMock = module.get(PersonRepository);
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
            suchFilter: '',
            rolleID: '',
            organisationID: '',
        };
        const person1: Person<true> = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            'Max',
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );
        const person2: Person<true> = Person.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.person.lastName(),
            faker.person.firstName(),
            '1',
            faker.lorem.word(),
            faker.lorem.word(),
            faker.string.uuid(),
        );

        const personenkontext1: Personenkontext<true> = Personenkontext.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            person1.id,
            faker.string.uuid(),
            faker.string.uuid(),
        );

        it('should get all persons', async () => {
            const personPermissions: DeepMocked<PersonPermissions> = createMock();
            personPermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([personController.ROOT_ORGANISATION_ID]);

            personRepositoryMock.findBy.mockResolvedValue([[person1, person2], 2]);

            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(
                queryParams,
                personPermissions,
            );
            expect(personRepositoryMock.findBy).toHaveBeenCalledTimes(1);
            expect(result.total).toEqual(2);
            expect(result.limit).toEqual(2);
            expect(result.offset).toEqual(0);
            expect(result.items.length).toEqual(2);
            expect(result.items.at(0)?.person.name.vorname).toEqual('Max');
        });

        it('should get a person with the given rolle id', async () => {
            const personPermissions: DeepMocked<PersonPermissions> = createMock();
            personPermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([personController.ROOT_ORGANISATION_ID]);

            personRepositoryMock.findBy.mockResolvedValue([[person1], 1]);
            const rolleID: string = personenkontext1.rolleId;
            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(
                { ...queryParams, rolleID },
                personPermissions,
            );

            expect(personRepositoryMock.findBy).toHaveBeenCalledTimes(1);
            expect(result.total).toEqual(1);
            expect(result.limit).toEqual(1);
            expect(result.offset).toEqual(0);
            expect(result.items.length).toEqual(1);
            expect(result.items.at(0)?.person.name.vorname).toEqual('Max');
            expect(result.items.at(0)?.person.id).toEqual(person1.id);
        });

        it('should get a person with the given orgnisation id', async () => {
            const personPermissions: DeepMocked<PersonPermissions> = createMock();
            const organisationID = personenkontext1.organisationId;
            personPermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([
                personController.ROOT_ORGANISATION_ID,
                organisationID,
            ]);

            personRepositoryMock.findBy.mockResolvedValue([[person1], 1]);

            const result: PagedResponse<PersonendatensatzResponse> = await personController.findPersons(
                { ...queryParams, organisationID },
                personPermissions,
            );

            expect(personRepositoryMock.findBy).toHaveBeenCalledTimes(1);
            expect(result.total).toEqual(1);
            expect(result.limit).toEqual(1);
            expect(result.offset).toEqual(0);
            expect(result.items.length).toEqual(1);
            expect(result.items.at(0)?.person.name.vorname).toEqual('Max');
            expect(result.items.at(0)?.person.id).toEqual(person1.id);
        });

        it('should throw an error when organisationID is not in the permissions', async () => {
            const personPermissions: DeepMocked<PersonPermissions> = createMock();
            personPermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce(['someOtherOrganisationID']);

            personRepositoryMock.findBy.mockResolvedValueOnce([[], 0]);

            const organisationID: string = 'organisationIDNotInPermissions';
            await expect(
                personController.findPersons({ ...queryParams, organisationID }, personPermissions),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
