import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../../test/utils/index.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { NurLehrUndLernAnKlasse } from './nur-lehr-und-lern-an-klasse.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { faker } from '@faker-js/faker';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { GleicheRolleAnKlasseWieSchule } from './gleiche-rolle-an-klasse-wie-schule.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    personenkontextFactory: PersonenkontextFactory,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = personenkontextFactory.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

describe('PersonenkontextSpecificationsMockedReposTest', () => {
    let module: TestingModule;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personenkontextFactory: PersonenkontextFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false }), MapperTestModule],
            providers: [
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepo,
                    useValue: createMock<PersonRepo>(),
                },
                PersonenkontextFactory,
            ],
        }).compile();
        organisationRepoMock = module.get(OrganisationRepo);
        rolleRepoMock = module.get(RolleRepo);
        personenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
    }, 100000);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('Nur LEHR Und LERN An Klasse', () => {
        it('should be satisfied when organisation typ is not KLASSE', async () => {
            const organisation: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            organisation.typ = OrganisationsTyp.SCHULE;
            const specification: NurLehrUndLernAnKlasse = new NurLehrUndLernAnKlasse(
                organisationRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            organisationRepoMock.findById.mockResolvedValueOnce(organisation);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeTruthy();
        });

        it('should not be satisfied when organisation could not be found', async () => {
            const specification: NurLehrUndLernAnKlasse = new NurLehrUndLernAnKlasse(
                organisationRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });

        it('should not be satisfied when rolle could not be found', async () => {
            const organisation: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            organisation.typ = OrganisationsTyp.KLASSE;
            const specification: NurLehrUndLernAnKlasse = new NurLehrUndLernAnKlasse(
                organisationRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);

            organisationRepoMock.findById.mockResolvedValueOnce(organisation);
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });
    });

    describe('Gleiche Rolle An Klasse Wie Schule', () => {
        it('should be satisfied when organisation type is not KLASSE', async () => {
            const organisation: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            organisation.typ = OrganisationsTyp.SCHULE;
            const specification: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
                organisationRepoMock,
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            organisationRepoMock.findById.mockResolvedValueOnce(organisation);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeTruthy();
        });

        it('should not be satisfied when organisation could not be found', async () => {
            const specification: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
                organisationRepoMock,
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });

        it('should not be satisfied when organisation type is KLASSE but not administriertVon', async () => {
            const organisation: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            organisation.typ = OrganisationsTyp.KLASSE;
            organisation.administriertVon = undefined;
            const specification: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
                organisationRepoMock,
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            organisationRepoMock.findById.mockResolvedValueOnce(organisation);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });

        it('should not be satisfied when rolle could not be found', async () => {
            const klasse: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            klasse.typ = OrganisationsTyp.KLASSE;
            const schule: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            schule.typ = OrganisationsTyp.SCHULE;
            klasse.administriertVon = schule.id;
            const specification: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
                organisationRepoMock,
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);
            const foundPersonenkontext: Personenkontext<true> = createMock<Personenkontext<true>>();
            schule.id = foundPersonenkontext.organisationId;
            const foundPersonenkontexte: Personenkontext<true>[] = [foundPersonenkontext];

            organisationRepoMock.findById.mockResolvedValueOnce(klasse); //mock Klasse
            organisationRepoMock.findById.mockResolvedValueOnce(schule); //mock Schule

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce(foundPersonenkontexte);
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });

        it('should not be satisfied when rolle objects are not identical', async () => {
            const organisation: OrganisationDo<true> = createMock<OrganisationDo<true>>();
            organisation.typ = OrganisationsTyp.KLASSE;
            const rolle: Rolle<true> = createMock<Rolle<true>>();
            const specification: GleicheRolleAnKlasseWieSchule = new GleicheRolleAnKlasseWieSchule(
                organisationRepoMock,
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);

            organisationRepoMock.findById.mockResolvedValueOnce(organisation);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            expect(await specification.isSatisfiedBy(personenkontext)).toBeFalsy();
        });
    });
});
