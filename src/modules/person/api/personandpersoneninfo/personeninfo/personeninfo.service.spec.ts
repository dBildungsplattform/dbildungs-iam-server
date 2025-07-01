import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonenInfoService } from './personeninfo.service.js';
import { ClassLogger } from '../../../../../core/logging/class-logger.js';
import { PersonRepository } from '../../../persistence/person.repository.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EmailRepo } from '../../../../email/persistence/email.repo.js';
import { UserLockRepository } from '../../../../keycloak-administration/repository/user-lock.repository.js';
import { PersonPermissions } from '../../../../authentication/domain/person-permissions.js';
import { PersonInfoResponseV1 } from '../personinfo/v1/person-info.response.v1.js';
import { Personenkontext } from '../../../../personenkontext/domain/personenkontext.js';
import { DoFactory } from '../../../../../../test/utils/do-factory.js';
import { Rolle } from '../../../../rolle/domain/rolle.js';
import { RollenArt, RollenSystemRecht } from '../../../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../../../organisation/domain/organisation.js';

describe('PersonInfoService', () => {
    let module: TestingModule;
    let sut: PersonenInfoService;

    let loggerMock: DeepMocked<ClassLogger>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let emailRepo: DeepMocked<EmailRepo>;
    let userLockRepo: DeepMocked<UserLockRepository>;

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
        emailRepo = module.get(EmailRepo);
        userLockRepo = module.get(UserLockRepository);
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
        expect(emailRepo).toBeDefined();
        expect(userLockRepo).toBeDefined();
    });

    describe('when caller has 0 organisations with systemrecht PERSONEN_LESEN', () => {
        it('should return empty array', async () => {
            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(
                createMock<PersonPermissions>(),
                0,
                10,
            );
            expect(res.length).toEqual(0);
            expect(
                dBiamPersonenkontextRepoMock.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).not.toHaveBeenCalled();
        });
    });

    describe('when caller has organisations with systemrecht PERSONEN_LESEN', () => {
        it('should return empty array', async () => {
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

            const res: PersonInfoResponseV1[] = await sut.findPersonsForPersonenInfo(permissions, 0, 10);
            expect(res).toBeDefined();
            expect(
                dBiamPersonenkontextRepoMock.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations,
            ).toHaveBeenCalled();
        });
    });
});
