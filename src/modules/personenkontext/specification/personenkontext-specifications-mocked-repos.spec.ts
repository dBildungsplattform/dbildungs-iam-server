import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { NurLehrUndLernAnKlasse } from './nur-lehr-und-lern-an-klasse.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { faker } from '@faker-js/faker';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { GleicheRolleAnKlasseWieSchule } from './gleiche-rolle-an-klasse-wie-schule.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { CheckRollenartLernSpecification } from './nur-rolle-lern.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

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
        undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

describe('PersonenkontextSpecificationsMockedReposTest', () => {
    let module: TestingModule;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;

    let personenkontextFactory: PersonenkontextFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: false }), MapperTestModule],
            providers: [
                PersonenkontextFactory,
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                PersonenkontextFactory,
            ],
        }).compile();
        organisationRepoMock = module.get(OrganisationRepository);
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
            const organisation: Organisation<true> = createMock<Organisation<true>>();
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
            const organisation: Organisation<true> = createMock<Organisation<true>>();
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
            const organisation: Organisation<true> = createMock<Organisation<true>>();
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
            const organisation: Organisation<true> = createMock<Organisation<true>>();
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
            const klasse: Organisation<true> = createMock<Organisation<true>>();
            klasse.typ = OrganisationsTyp.KLASSE;
            const schule: Organisation<true> = createMock<Organisation<true>>();
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
            const organisation: Organisation<true> = createMock<Organisation<true>>();
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
    describe('Nur Lern kontext when person has LERN kontexte already', () => {
        it('should pass the check when there are no existing LERN roles', async () => {
            const specification: CheckRollenartLernSpecification = new CheckRollenartLernSpecification(
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createMock<Personenkontext<false>>();
            const existingPersonenkontexte: Personenkontext<true>[] = [];

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce(existingPersonenkontexte);

            const mapRollen: Map<string, Rolle<true>> = new Map();
            mapRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LEHR }));
            mapRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LEHR }));
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);

            const result: boolean = await specification.checkRollenartLern([personenkontext]);

            expect(result).toBe(true);
        });

        it('should pass the check when there are existing LERN roles and the new role is also LERN', async () => {
            const specification: CheckRollenartLernSpecification = new CheckRollenartLernSpecification(
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createMock<Personenkontext<false>>();
            const existingPersonenkontext: Personenkontext<true> = createMock<Personenkontext<true>>();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([existingPersonenkontext]);

            const mapRollen: Map<string, Rolle<true>> = new Map();
            mapRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LERN }));
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);

            const result: boolean = await specification.checkRollenartLern([personenkontext]);

            expect(result).toBe(true);
        });

        it('should fail the check when there are existing LERN roles and the new role is not LERN', async () => {
            const specification: CheckRollenartLernSpecification = new CheckRollenartLernSpecification(
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createMock<Personenkontext<false>>();
            const existingPersonenkontext: Personenkontext<true> = createMock<Personenkontext<true>>();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([existingPersonenkontext]);

            const mapRollen: Map<string, Rolle<true>> = new Map();
            mapRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LEHR }));
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);

            const mapExistingRollen: Map<string, Rolle<true>> = new Map();
            mapExistingRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LERN }));
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapExistingRollen);

            const result: boolean = await specification.checkRollenartLern([personenkontext]);

            expect(result).toBe(false);
        });

        it('should pass the check when there are existing roles, but none are of type LERN', async () => {
            const specification: CheckRollenartLernSpecification = new CheckRollenartLernSpecification(
                personenkontextRepoMock,
                rolleRepoMock,
            );
            const personenkontext: Personenkontext<false> = createMock<Personenkontext<false>>();
            const existingPersonenkontext: Personenkontext<true> = createMock<Personenkontext<true>>();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([existingPersonenkontext]);

            const mapRollen: Map<string, Rolle<true>> = new Map();
            mapRollen.set(faker.string.uuid(), DoFactory.createRolle(true, { rollenart: RollenArt.LEHR }));
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);
            rolleRepoMock.findByIds.mockResolvedValueOnce(mapRollen);

            const result: boolean = await specification.checkRollenartLern([personenkontext]);

            expect(result).toBe(true);
        });
    });
});
