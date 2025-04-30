import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { PersonApiMapper } from '../../mapper/person-api.mapper.js';
import { PersonInfoController } from './person-info.controller.js';
import { PersonInfoResponse, PersonNestedInPersonInfoResponse } from './person-info.response.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { DoFactory } from '../../../../../test/utils/do-factory.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../persistence/person.repository.js';
import { Person } from '../../domain/person.js';
import { EmailRepo } from '../../../email/persistence/email.repo.js';
import { EmailAddressStatus } from '../../../email/domain/email-address.js';
import { PersonEmailResponse } from '../person-email-response.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { PersonenkontextResponse } from '../../../personenkontext/api/response/personenkontext.response.js';
import { Organisation } from '../../../organisation/domain/organisation.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { PersonBirthResponse } from '../person-birth.response.js';
import { PersonNameResponse } from '../person-name.response.js';
import { PersonInfoResponseV1 } from './v1/person-info.response.v1.js';

describe('PersonInfoController', () => {
    let module: TestingModule;
    let sut: PersonInfoController;
    let personRepoMock: DeepMocked<PersonRepository>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let personApiMapper: DeepMocked<PersonApiMapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonInfoController,
                {
                    provide: PersonApiMapper,
                    useValue: createMock<PersonApiMapper>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: EmailRepo,
                    useValue: createMock<EmailRepo>(),
                },
            ],
        }).compile();

        sut = module.get<PersonInfoController>(PersonInfoController);
        personRepoMock = module.get(PersonRepository);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        emailRepoMock = module.get(EmailRepo);
        personApiMapper = module.get(PersonApiMapper);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('info', () => {
        let expectedBaseNestedPersonInfo: null | PersonNestedInPersonInfoResponse = null;
        let person: null | Person<true> = null;
        let orga: null | Organisation<true> = null;
        beforeEach(() => {
            person = DoFactory.createPerson(true);
            orga = DoFactory.createOrganisation(true);
            expectedBaseNestedPersonInfo = {
                id: person.id,
                mandant: person.mandant,
                referrer: person.referrer,
                name: {
                    familiennamen: person.familienname,
                    vorname: person.vorname,
                    anrede: person.nameAnrede,
                    initialenfamilienname: person.initialenFamilienname,
                    initialenvorname: person.initialenVorname,
                    rufname: person.rufname,
                    titel: person.nameTitel,
                    namenspraefix: person.namePraefix,
                    namenssuffix: person.nameSuffix,
                    sortierindex: person.nameSortierindex,
                } satisfies PersonNameResponse,
                geburt: {
                    datum: person.geburtsdatum,
                    geburtsort: person.geburtsort,
                } satisfies PersonBirthResponse,
                stammorganisation: person.stammorganisation,
                geschlecht: person.geschlecht,
                lokalisierung: person.lokalisierung,
                vertrauensstufe: person.vertrauensstufe,
                personalnummer: person.personalnummer,
                revision: person.revision,
                dienststellen: [],
            };
        });
        describe('when person exists', () => {
            it('should return person info with loeschung', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    loeschungZeitpunkt: new Date(),
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([
                    {
                        personenkontext: kontext,
                        organisation: orga!,
                        rolle: rolle,
                    } satisfies KontextWithOrgaAndRolle,
                ]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponse = await sut.info(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponse);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [orga!.kennung] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(1);
                expect(result.personenkontexte.at(0)?.id).toEqual(kontext.id);
                expect(result.personenkontexte.at(0)?.organisation.id).toEqual(orga?.id);
                expect(result.personenkontexte.at(0)?.organisation.kennung).toEqual(orga?.kennung);
                expect(result.personenkontexte.at(0)?.organisation.name).toEqual(orga?.name);
                expect(result.personenkontexte.at(0)?.organisation.typ).toEqual(orga?.typ);
                expect(result.personenkontexte.at(0)?.rollenart).toEqual(rolle.rollenart);
                expect(result.personenkontexte.at(0)?.rollenname).toEqual(rolle.name);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
            it('should return person info with no loeschungZeitpunkt', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    loeschungZeitpunkt: undefined,
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([
                    {
                        personenkontext: kontext,
                        organisation: orga!,
                        rolle: rolle,
                    } satisfies KontextWithOrgaAndRolle,
                ]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponse = await sut.info(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponse);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [orga!.kennung] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(1);
                expect(result.personenkontexte.at(0)?.id).toEqual(kontext.id);
                expect(result.personenkontexte.at(0)?.organisation.id).toEqual(orga?.id);
                expect(result.personenkontexte.at(0)?.organisation.kennung).toEqual(orga?.kennung);
                expect(result.personenkontexte.at(0)?.organisation.name).toEqual(orga?.name);
                expect(result.personenkontexte.at(0)?.organisation.typ).toEqual(orga?.typ);
                expect(result.personenkontexte.at(0)?.rollenart).toEqual(rolle.rollenart);
                expect(result.personenkontexte.at(0)?.rollenname).toEqual(rolle.name);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
            it('should return person info with empty dnr array and no kontexte', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                orga!.kennung = undefined;
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponse = await sut.info(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponse);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(0);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
        });

        describe('when person does not exist', () => {
            it('should return null', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;

                personRepoMock.findById.mockResolvedValue(null);

                await expect(() => sut.info(permissions)).rejects.toThrow(HttpException);
            });
        });
    });

    describe('infoV1', () => {
        let expectedBaseNestedPersonInfo: null | PersonNestedInPersonInfoResponse = null;
        let person: null | Person<true> = null;
        let orga: null | Organisation<true> = null;
        beforeEach(() => {
            person = DoFactory.createPerson(true);
            orga = DoFactory.createOrganisation(true);
            expectedBaseNestedPersonInfo = {
                id: person.id,
                mandant: person.mandant,
                referrer: person.referrer,
                name: {
                    familiennamen: person.familienname,
                    vorname: person.vorname,
                    anrede: person.nameAnrede,
                    initialenfamilienname: person.initialenFamilienname,
                    initialenvorname: person.initialenVorname,
                    rufname: person.rufname,
                    titel: person.nameTitel,
                    namenspraefix: person.namePraefix,
                    namenssuffix: person.nameSuffix,
                    sortierindex: person.nameSortierindex,
                } satisfies PersonNameResponse,
                geburt: {
                    datum: person.geburtsdatum,
                    geburtsort: person.geburtsort,
                } satisfies PersonBirthResponse,
                stammorganisation: person.stammorganisation,
                geschlecht: person.geschlecht,
                lokalisierung: person.lokalisierung,
                vertrauensstufe: person.vertrauensstufe,
                personalnummer: person.personalnummer,
                revision: person.revision,
                dienststellen: [],
            };
        });
        describe('when person exists', () => {
            it('should return person info with loeschung', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    loeschungZeitpunkt: new Date(),
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([
                    {
                        personenkontext: kontext,
                        organisation: orga!,
                        rolle: rolle,
                    } satisfies KontextWithOrgaAndRolle,
                ]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponseV1 = await sut.infoV1(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponseV1);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [orga!.kennung] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(1);
                expect(result.personenkontexte.at(0)?.id).toEqual(kontext.id);
                expect(result.personenkontexte.at(0)?.organisation.id).toEqual(orga?.id);
                expect(result.personenkontexte.at(0)?.organisation.kennung).toEqual(orga?.kennung);
                expect(result.personenkontexte.at(0)?.organisation.name).toEqual(orga?.name);
                expect(result.personenkontexte.at(0)?.organisation.typ).toEqual(orga?.typ);
                expect(result.personenkontexte.at(0)?.rollenart).toEqual(rolle.rollenart);
                expect(result.personenkontexte.at(0)?.rollenname).toEqual(rolle.name);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
            it('should return person info with no loeschungZeitpunkt', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    loeschungZeitpunkt: undefined,
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([
                    {
                        personenkontext: kontext,
                        organisation: orga!,
                        rolle: rolle,
                    } satisfies KontextWithOrgaAndRolle,
                ]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponseV1 = await sut.infoV1(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponseV1);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [orga!.kennung] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(1);
                expect(result.personenkontexte.at(0)?.id).toEqual(kontext.id);
                expect(result.personenkontexte.at(0)?.organisation.id).toEqual(orga?.id);
                expect(result.personenkontexte.at(0)?.organisation.kennung).toEqual(orga?.kennung);
                expect(result.personenkontexte.at(0)?.organisation.name).toEqual(orga?.name);
                expect(result.personenkontexte.at(0)?.organisation.typ).toEqual(orga?.typ);
                expect(result.personenkontexte.at(0)?.rollenart).toEqual(rolle.rollenart);
                expect(result.personenkontexte.at(0)?.rollenname).toEqual(rolle.name);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
            it('should return person info with empty dnr array and no kontexte', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;
                const email: PersonEmailResponse = {
                    address: faker.internet.email(),
                    status: faker.helpers.enumValue(EmailAddressStatus),
                };
                orga!.kennung = undefined;
                const rolle: Rolle<true> = DoFactory.createRolle(true);
                const kontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                    getRolle: () => Promise.resolve(rolle),
                    getOrganisation() {
                        return Promise.resolve(orga);
                    },
                });
                const personenkontextResponseMock: PersonenkontextResponse = createMock<PersonenkontextResponse>();

                personRepoMock.findById.mockResolvedValue(person);
                personApiMapper.mapToPersonenkontextResponse.mockResolvedValueOnce(personenkontextResponseMock);
                personenkontextRepoMock.findByPerson.mockResolvedValueOnce([kontext]);
                personenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValueOnce([]);
                emailRepoMock.getEmailAddressAndStatusForPerson.mockResolvedValueOnce(email);

                const result: PersonInfoResponseV1 = await sut.infoV1(permissions);
                expect(result).toBeInstanceOf(PersonInfoResponseV1);
                expect(result.person).toBeInstanceOf(PersonNestedInPersonInfoResponse);
                expect(result.person).toEqual({ ...expectedBaseNestedPersonInfo, dienststellen: [] });

                expect(result.pid).toEqual(person?.id);
                expect(result.personenkontexte.length).toEqual(0);
                expect(result.gruppen).toEqual([]);
                expect(result.email).toEqual({
                    address: email.address,
                    status: email.status,
                });
            });
        });

        describe('when person does not exist', () => {
            it('should return null', async () => {
                const permissions: PersonPermissions = {
                    personFields: {
                        id: faker.string.uuid(),
                    },
                } as PersonPermissions;

                personRepoMock.findById.mockResolvedValue(null);

                await expect(() => sut.infoV1(permissions)).rejects.toThrow(HttpException);
            });
        });
    });
});
