import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonenInfoService } from './personeninfo.service.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { PersonRepository } from '../../../person/persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EmailRepo } from '../../../email/persistence/email.repo.js';
import { UserLockRepository } from '../../../keycloak-administration/repository/user-lock.repository.js';
import { PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import { PersonInfoResponseV1 } from '../../api/personinfo/v1/person-info.response.v1.js';
import { Personenkontext } from '../../../personenkontext/domain/personenkontext.js';
import { DoFactory } from '../../../../../test/utils/do-factory.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';
import { RollenSystemRecht } from '../../../rolle/domain/systemrecht.js';
import { OrganisationsTyp } from '../../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../../organisation/domain/organisation.js';
import { faker } from '@faker-js/faker';
import { PersonEmailResponse } from '../../../person/api/person-email-response.js';
import { SchulconnexRepo } from '../../persistence/schulconnex.repo.js';

describe('PersonInfoService', () => {
    let module: TestingModule;
    let sut: PersonenInfoService;

    let loggerMock: DeepMocked<ClassLogger>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let schulconnexRepo: DeepMocked<SchulconnexRepo>;
    let emailRepoMock: DeepMocked<EmailRepo>;
    let userLockRepoMock: DeepMocked<UserLockRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenInfoService,
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: SchulconnexRepo,
                    useValue: createMock<SchulconnexRepo>(),
                },
                {
                    provide: EmailRepo,
                    useValue: createMock<EmailRepo>(),
                },
                {
                    provide: UserLockRepository,
                    useValue: createMock<UserLockRepository>(),
                },
            ],
        }).compile();

        sut = module.get(PersonenInfoService);
        loggerMock = module.get(ClassLogger);
        personRepositoryMock = module.get(PersonRepository);
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        emailRepoMock = module.get(EmailRepo);
        userLockRepoMock = module.get(UserLockRepository);
        schulconnexRepo = module.get(SchulconnexRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(loggerMock).toBeDefined();
        expect(personRepositoryMock).toBeDefined();
        expect(dBiamPersonenkontextRepoMock).toBeDefined();
        expect(emailRepoMock).toBeDefined();
        expect(userLockRepoMock).toBeDefined();
    });

    describe('when caller has 0 organisations with systemrecht PERSONEN_LESEN', () => {
        it('should return empty array', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [],
            });
            dBiamPersonenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValue([]);
            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(
                createMock<PersonPermissions>(),
                0,
                10,
            );
            expect(res.length).toEqual(0);
            expect(
                schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).not.toHaveBeenCalled();
        });
    });

    describe('when caller has organisations with systemrecht PERSONEN_LESEN', () => {
        it('should return persons with specific permissions', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            const orga1: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const orga2: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.SYSADMIN,
                systemrechte: [RollenSystemRecht.PERSONEN_LESEN],
                serviceProviderIds: ['serviceProvider1', 'serviceProvider2'],
            });
            const kontext1: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga1);
                },
            });
            const kontext2: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga2);
                },
            });

            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [orga1.id, orga1.id],
            });
            dBiamPersonenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValue([
                {
                    personenkontext: kontext1,
                    organisation: orga1,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
                {
                    personenkontext: kontext2,
                    organisation: orga2,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
            ]);

            const personId1: string = faker.string.uuid();
            const personId2: string = faker.string.uuid();
            schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations.mockResolvedValueOnce([
                personId1,
            ]);
            schulconnexRepo.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations.mockResolvedValueOnce(
                [personId2],
            );

            personRepositoryMock.findByPersonIds.mockResolvedValue([
                DoFactory.createPerson(true, { id: personId1 }),
                DoFactory.createPerson(true, { id: personId1 }),
            ]);
            emailRepoMock.getEmailAddressAndStatusForPersonIds.mockResolvedValue(
                new Map([
                    [personId1, createMock<PersonEmailResponse>()],
                    [personId2, createMock<PersonEmailResponse>()],
                ]),
            );
            dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle.mockResolvedValue(
                new Map([
                    [personId1, createMock<KontextWithOrgaAndRolle[]>()],
                    [personId2, createMock<KontextWithOrgaAndRolle[]>()],
                ]),
            );
            userLockRepoMock.findByPersonIds.mockResolvedValue(
                new Map([
                    [personId1, []],
                    [personId2, []],
                ]),
            );

            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(permissions, 0, 10);
            expect(res).toBeDefined();
            expect(
                schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).toHaveBeenCalled();
            expect(personRepositoryMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(emailRepoMock.getEmailAddressAndStatusForPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(
                dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle,
            ).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
                expect.arrayContaining(rolle.serviceProviderIds),
                { all: false, orgaIds: [orga1.id, orga1.id] },
            );
            expect(userLockRepoMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(res.length).toEqual(2);
            expect(res[0]).toBeInstanceOf(PersonInfoResponseV1);
            expect(res[1]).toBeInstanceOf(PersonInfoResponseV1);
        });

        it('should return persons with all permissions', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            const orga1: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const orga2: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.SYSADMIN,
                systemrechte: [RollenSystemRecht.PERSONEN_LESEN],
                serviceProviderIds: ['serviceProvider1', 'serviceProvider2'],
            });
            const kontext1: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga1);
                },
            });
            const kontext2: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga2);
                },
            });

            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });
            dBiamPersonenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValue([
                {
                    personenkontext: kontext1,
                    organisation: orga1,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
                {
                    personenkontext: kontext2,
                    organisation: orga2,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
            ]);

            const personId1: string = faker.string.uuid();
            const personId2: string = faker.string.uuid();
            schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations.mockResolvedValueOnce([
                personId1,
                personId2,
            ]);
            schulconnexRepo.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations.mockResolvedValueOnce(
                [],
            );

            personRepositoryMock.findByPersonIds.mockResolvedValue([
                DoFactory.createPerson(true, { id: personId1 }),
                DoFactory.createPerson(true, { id: personId1 }),
            ]);
            emailRepoMock.getEmailAddressAndStatusForPersonIds.mockResolvedValue(
                new Map([
                    [personId1, createMock<PersonEmailResponse>()],
                    [personId2, createMock<PersonEmailResponse>()],
                ]),
            );
            dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle.mockResolvedValue(
                new Map([
                    [personId1, createMock<KontextWithOrgaAndRolle[]>()],
                    [personId2, createMock<KontextWithOrgaAndRolle[]>()],
                ]),
            );
            userLockRepoMock.findByPersonIds.mockResolvedValue(
                new Map([
                    [personId1, []],
                    [personId2, []],
                ]),
            );

            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(permissions, 0, 10);
            expect(res).toBeDefined();
            expect(
                schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).toHaveBeenCalled();
            expect(personRepositoryMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(emailRepoMock.getEmailAddressAndStatusForPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(
                dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle,
            ).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
                expect.arrayContaining(rolle.serviceProviderIds),
                { all: true },
            );
            expect(userLockRepoMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(res.length).toEqual(2);
            expect(res[0]).toBeInstanceOf(PersonInfoResponseV1);
            expect(res[1]).toBeInstanceOf(PersonInfoResponseV1);
        });

        it('should return persons and default to empty kontext and userlock array', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            const orga1: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const orga2: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.SYSADMIN,
                systemrechte: [RollenSystemRecht.PERSONEN_LESEN],
                serviceProviderIds: ['serviceProvider1', 'serviceProvider2'],
            });
            const kontext1: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga1);
                },
            });
            const kontext2: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                loeschungZeitpunkt: new Date(),
                getRolle: () => Promise.resolve(rolle),
                getOrganisation() {
                    return Promise.resolve(orga2);
                },
            });

            permissions.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });
            dBiamPersonenkontextRepoMock.findByPersonWithOrgaAndRolle.mockResolvedValue([
                {
                    personenkontext: kontext1,
                    organisation: orga1,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
                {
                    personenkontext: kontext2,
                    organisation: orga2,
                    rolle: rolle,
                } satisfies KontextWithOrgaAndRolle,
            ]);

            const personId1: string = faker.string.uuid();
            const personId2: string = faker.string.uuid();
            schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations.mockResolvedValueOnce([
                personId1,
                personId2,
            ]);
            schulconnexRepo.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations.mockResolvedValueOnce(
                [],
            );

            personRepositoryMock.findByPersonIds.mockResolvedValue([
                DoFactory.createPerson(true, { id: personId1 }),
                DoFactory.createPerson(true, { id: personId1 }),
            ]);
            emailRepoMock.getEmailAddressAndStatusForPersonIds.mockResolvedValue(
                new Map([
                    [personId1, createMock<PersonEmailResponse>()],
                    [personId2, createMock<PersonEmailResponse>()],
                ]),
            );
            dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle.mockResolvedValue(
                new Map([
                    ['', createMock<KontextWithOrgaAndRolle[]>()],
                    ['', createMock<KontextWithOrgaAndRolle[]>()],
                ]),
            );
            userLockRepoMock.findByPersonIds.mockResolvedValue(
                new Map([
                    ['', []],
                    ['', []],
                ]),
            );

            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(permissions, 0, 10);
            expect(res).toBeDefined();
            expect(
                schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).toHaveBeenCalled();
            expect(personRepositoryMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(emailRepoMock.getEmailAddressAndStatusForPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(
                dBiamPersonenkontextRepoMock.findByPersonIdsAndServiceprovidersWithOrgaAndRolle,
            ).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
                expect.arrayContaining(rolle.serviceProviderIds),
                { all: true },
            );
            expect(userLockRepoMock.findByPersonIds).toHaveBeenCalledWith(
                expect.arrayContaining([personId1, personId2]),
            );
            expect(res.length).toEqual(2);
            expect(res[0]).toBeInstanceOf(PersonInfoResponseV1);
            expect(res[1]).toBeInstanceOf(PersonInfoResponseV1);
        });
    });
});
