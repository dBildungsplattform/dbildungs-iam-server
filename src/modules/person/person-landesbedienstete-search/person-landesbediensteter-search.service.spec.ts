import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';

import { PersonLandesbediensteterSearchService } from './person-landesbediensteter-search.service.js';
import { PersonRepository } from '../persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { UserLock } from '../../keycloak-administration/domain/user-lock.js';
import { PersonLockOccasion } from '../domain/person.enums.js';
import { LandesbediensteterSearchNoPersonFoundError } from '../domain/landesbediensteter-search-no-person-found.error.js';
import { LandesbediensteterSearchMultiplePersonsFoundError } from '../domain/landesbediensteter-search-multiple-persons-found.error.js';
import { Person } from '../domain/person.js';
import { EmailAddressStatus } from '../../email/domain/email-address.js';
import { PersonEmailResponse } from '../api/person-email-response.js';
import { PersonLandesbediensteterSearchResponse } from '../api/person-landesbediensteter-search.response.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';

describe('PersonLandesbediensteterSearchService', () => {
    let module: TestingModule;
    let sut: PersonLandesbediensteterSearchService;

    let personRepositoryMock: DeepMocked<PersonRepository>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let userLockRepositoryMock: DeepMocked<UserLockRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonLandesbediensteterSearchService,
                { provide: PersonRepository, useValue: createMock<PersonRepository>() },
                { provide: DBiamPersonenkontextRepo, useValue: createMock<DBiamPersonenkontextRepo>() },
                { provide: EmailRepo, useValue: createMock<EmailRepo>() },
                { provide: UserLockRepository, useValue: createMock<UserLockRepository>() },
            ],
        }).compile();

        sut = module.get(PersonLandesbediensteterSearchService);
        personRepositoryMock = module.get(PersonRepository);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        emailRepoMock = module.get(EmailRepo);
        userLockRepositoryMock = module.get(UserLockRepository);
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

    describe('findLandesbediensteter', () => {
        it('should throw if more than one param is defined', async () => {
            await expect(sut.findLandesbediensteter(faker.string.uuid(), faker.internet.email())).rejects.toThrow(
                LandesbediensteterSearchNoPersonFoundError,
            );
        });

        it('should throw if no param is defined', async () => {
            await expect(sut.findLandesbediensteter()).rejects.toThrow(LandesbediensteterSearchNoPersonFoundError);
        });

        it('should throw if no person found', async () => {
            personRepositoryMock.findByUsername.mockResolvedValueOnce([]);
            await expect(sut.findLandesbediensteter(undefined, undefined, faker.internet.userName())).rejects.toThrow(
                LandesbediensteterSearchNoPersonFoundError,
            );
        });

        it('should throw if multiple persons found', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            personRepositoryMock.findByUsername.mockResolvedValueOnce([person, person]);
            await expect(sut.findLandesbediensteter(undefined, undefined, faker.internet.userName())).rejects.toThrow(
                LandesbediensteterSearchMultiplePersonsFoundError,
            );
        });

        it('should throw if person has no personalnummer', async () => {
            const person: Person<true> = DoFactory.createPerson(true, { personalnummer: undefined });
            personRepositoryMock.findByUsername.mockResolvedValueOnce([person]);
            userLockRepositoryMock.findByPersonId.mockResolvedValueOnce([]);
            await expect(sut.findLandesbediensteter(undefined, undefined, faker.internet.userName())).rejects.toThrow(
                LandesbediensteterSearchNoPersonFoundError,
            );
        });

        it('should throw if person is locked manually', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            personRepositoryMock.findByUsername.mockResolvedValueOnce([person]);
            userLockRepositoryMock.findByPersonId.mockResolvedValueOnce([
                { locked_occasion: PersonLockOccasion.MANUELL_GESPERRT } as UserLock,
            ]);
            await expect(sut.findLandesbediensteter(undefined, undefined, faker.internet.userName())).rejects.toThrow(
                LandesbediensteterSearchNoPersonFoundError,
            );
        });

        it('should return valid response if person is found and valid', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            const email: PersonEmailResponse = {
                address: faker.internet.email(),
                status: faker.helpers.enumValue(EmailAddressStatus),
            };
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga);
                },
            });
            const kontexte: Array<KontextWithOrgaAndRolle> = [
                {
                    personenkontext: kontext,
                    organisation: orga,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
            ];
            personRepositoryMock.findByUsername.mockResolvedValueOnce([person]);
            userLockRepositoryMock.findByPersonId.mockResolvedValueOnce([]);
            emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);
            personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce(kontexte);

            const result: PersonLandesbediensteterSearchResponse = await sut.findLandesbediensteter(
                undefined,
                undefined,
                faker.internet.userName(),
            );

            expect(result).toBeDefined();
            expect(result.personalnummer).toEqual(person.personalnummer);
            expect(result.personenkontexte.length).toEqual(1);
            expect(result.personenkontexte.at(0)?.organisationId).toEqual(orga.id);
            expect(result.personenkontexte.at(0)?.organisationName).toEqual(orga.name);
            expect(result.personenkontexte.at(0)?.rolleId).toEqual(rolle.id);
            expect(result.personenkontexte.at(0)?.rolleName).toEqual(rolle.name);
            expect(result.primaryEmailAddress).toEqual(email.address);
        });
    });
});
