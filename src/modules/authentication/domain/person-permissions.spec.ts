import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS, DoFactory } from '../../../../test/utils/index.js';
import { RolleID, ServiceProviderID } from '../../../shared/types/index.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { PersonenkontextRolleFieldsResponse } from '../api/personen-kontext-rolle-fields.response.js';
import { RollenSystemRechtServiceProviderIDResponse } from '../api/rolle-systemrechte-serviceproviderid.response.js';
import { PersonPermissionsRepo } from './person-permission.repo.js';
import {
    PermittedOrgas,
    PersonenkontextRolleWithOrganisation,
    PersonFields,
    PersonPermissions,
} from './person-permissions.js';

function createPerson(): Person<true> {
    return Person.construct(
        faker.string.uuid(),
        faker.date.past(),
        faker.date.recent(),
        faker.person.lastName(),
        faker.person.firstName(),
        '1',
        faker.lorem.word(),
        undefined,
        faker.string.uuid(),
    );
}

describe('PersonPermissions', () => {
    let module: TestingModule;
    let dbiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;

    let personenkontextFactory: PersonenkontextFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                PersonPermissionsRepo,
                PersonenkontextFactory,
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: RollenerweiterungRepo,
                    useValue: createMock<RollenerweiterungRepo>(),
                },
                PersonenkontextFactory,
            ],
        }).compile();

        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        rolleRepoMock = module.get(RolleRepo);
        rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    function createPersonenkontext(): Personenkontext<true> {
        return personenkontextFactory.construct(
            '1',
            faker.date.past(),
            faker.date.recent(),
            '1',
            '1',
            '1',
            '1',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
    }

    describe('getRoleIds', () => {
        describe('when person can be found', () => {
            it('should load PersonPermissions', async () => {
                const person: Person<true> = createPerson();
                const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                const personPermissions: PersonPermissions = new PersonPermissions(
                    dbiamPersonenkontextRepoMock,
                    organisationRepoMock,
                    rolleRepoMock,
                    rollenerweiterungRepoMock,
                    person,
                );
                const ids: RolleID[] = await personPermissions.getRoleIds();
                expect(ids).toContain('1');
            });
        });
    });

    describe('personFields', () => {
        describe('when person can be found', () => {
            it('should return cached person fields', () => {
                const person: Person<true> = createPerson();
                const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                const personPermissions: PersonPermissions = new PersonPermissions(
                    dbiamPersonenkontextRepoMock,
                    organisationRepoMock,
                    rolleRepoMock,
                    rollenerweiterungRepoMock,
                    person,
                );
                const personFields: PersonFields = personPermissions.personFields;
                expect(personFields.id).toEqual(person.id);
                expect(personFields.familienname).toEqual(person.familienname);
                expect(personFields.vorname).toEqual(person.vorname);
                expect(personFields.keycloakUserId).toEqual(person.keycloakUserId);
                expect(personFields.username).toEqual(person.username);
            });
        });
    });

    describe('getOrgIdsWithSystemrecht', () => {
        it('should return { all: true } if person has rights at root', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const permittedOrgas: PermittedOrgas = await personPermissions.getOrgIdsWithSystemrecht(
                [RollenSystemRecht.PERSONEN_VERWALTEN],
                true,
            );

            expect(permittedOrgas.all).toBe(true);
        });
        it('should return orgas with children', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValue(false);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                createMock<Organisation<true>>({ id: '2' }),
            ]);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const permittedOrgas: PermittedOrgas = await personPermissions.getOrgIdsWithSystemrecht(
                [RollenSystemRecht.PERSONEN_VERWALTEN],
                true,
            );

            if (permittedOrgas.all) {
                fail('permittedOrgas.all should be false');
            }
            expect(permittedOrgas.orgaIds).toContain('1');
            expect(permittedOrgas.orgaIds).toContain('2');
        });

        it('should return organisations without children', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map<string, Rolle<true>>([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const permittedOrgas: PermittedOrgas = await personPermissions.getOrgIdsWithSystemrecht([
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            if (permittedOrgas.all) {
                fail('permittedOrgas.all should be false');
            }
            expect(permittedOrgas.orgaIds).toContain('1');
            expect(permittedOrgas.orgaIds).not.toContain('2');
        });

        it('should return organisations when matching one systemrecht', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );

            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValue(false);

            const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            const rolle: Rolle<true> = createMock<Rolle<true>>();
            rolle.systemrechte = [RollenSystemRecht.PERSONEN_LESEN];
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map<string, Rolle<true>>([['1', rolle]]));

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const permittedOrgas: PermittedOrgas = await personPermissions.getOrgIdsWithSystemrecht(
                [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.PERSONEN_LESEN],
                false,
                false,
            );
            if (permittedOrgas.all) {
                fail('permittedOrgas.all should be false');
            }
            expect(permittedOrgas.orgaIds).toContain('1');
            expect(permittedOrgas.orgaIds).not.toContain('2');
        });
    });

    describe('getPersonenkontexteWithRoles', () => {
        it('should return person context with system rights and service provider ids in an object roles', async () => {
            const person: Person<true> = createPerson();
            const personenkontexte: Personenkontext<true>[] = [createPersonenkontext()];
            const expectedOrganisation: Organisation<true> = createMock<Organisation<true>>({
                id: personenkontexte[0]!.organisationId,
            });
            const expectedRolle: Rolle<true> = createMock<Rolle<true>>({ hasSystemRecht: () => true });
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map([['1', expectedRolle]]));
            organisationRepoMock.findByIds.mockResolvedValueOnce(
                new Map([[expectedOrganisation.id, expectedOrganisation]]),
            );

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const result: PersonenkontextRolleWithOrganisation[] =
                await personPermissions.getPersonenkontexteWithRolesAndOrgs();

            const expected: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: expectedOrganisation,
                    rolle: {
                        systemrechte: expectedRolle.systemrechte,
                        serviceProviderIds: expectedRolle.serviceProviderIds,
                    },
                },
            ];

            expect(result).toEqual(expected);
        });
    });

    describe('PersonenkontextRolleFieldsResponse', () => {
        it('should create a valid PersonenkontextRolleFieldsResponse object', () => {
            const rollenSystemRechtServiceProviderID: RollenSystemRechtServiceProviderIDResponse =
                new RollenSystemRechtServiceProviderIDResponse(['right1', 'right2'], ['service1', 'service2']);
            const organisationResponse: OrganisationResponse = new OrganisationResponse(
                createMock<Organisation<true>>({ id: 'testOrgId' }),
            );
            const response: PersonenkontextRolleFieldsResponse = new PersonenkontextRolleFieldsResponse(
                organisationResponse,
                rollenSystemRechtServiceProviderID,
            );

            expect(response.organisation.id).toEqual('testOrgId');
            expect(response.rolle.systemrechte).toEqual(['right1', 'right2']);
            expect(response.rolle.serviceProviderIds).toEqual(['service1', 'service2']);
        });
    });

    describe('hasSystemrechteAtOrganisation', () => {
        it('should return true if person has the recht', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const result: boolean = await personPermissions.hasSystemrechteAtOrganisation('2', [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            expect(result).toBeTruthy();
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledTimes(1);
        });

        it('should return true if person has one of the systemrechte', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const result: boolean = await personPermissions.hasSystemrechteAtOrganisation(
                '2',
                [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.PERSONEN_LESEN],
                false,
            );
            expect(result).toBeTruthy();
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledTimes(2);
        });
    });

    describe('hasSystemrechteAtRootOrganisation', () => {
        it('should return true if person has the recht', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            const result: boolean = await personPermissions.hasSystemrechteAtRootOrganisation([
                RollenSystemRecht.PERSONEN_VERWALTEN,
                RollenSystemRecht.KLASSEN_VERWALTEN,
            ]);

            expect(result).toBeTruthy();
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledTimes(2);
        });
    });

    describe('canModifyPerson', () => {
        it('should return true, if person has permission at root', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechteAtRootOrganisation').mockResolvedValueOnce(true);

            const result: boolean = await personPermissions.canModifyPerson('2');

            expect(result).toBe(true);
        });

        it('should return false, if person is missing permissions on target person', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechteAtRootOrganisation').mockResolvedValueOnce(false);
            dbiamPersonenkontextRepoMock.hasPersonASystemrechtAtAnyKontextOfPersonB.mockResolvedValueOnce(false);

            const result: boolean = await personPermissions.canModifyPerson('2');

            expect(result).toBe(false);
        });

        it('should return true, if person has permissions on target person', async () => {
            const person: Person<true> = Person.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.person.lastName(),
                faker.person.firstName(),
                '1',
                faker.lorem.word(),
                undefined,
                faker.string.uuid(),
            );
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechteAtRootOrganisation').mockResolvedValueOnce(false);
            dbiamPersonenkontextRepoMock.hasPersonASystemrechtAtAnyKontextOfPersonB.mockResolvedValueOnce(true);

            const result: boolean = await personPermissions.canModifyPerson('2');

            expect(result).toBe(true);
        });
    });
    describe('hasOrgVerwaltenRechtAtOrga', () => {
        it('should return true if person has KLASSEN_VERWALTEN Recht at the administriertVon organisation', async () => {
            const person: Person<true> = createPerson();
            const oeffentlich: Organisation<true> = createMock<Organisation<true>>({ id: 'oeffentlichId' });
            organisationRepoMock.findRootDirectChildren.mockResolvedValueOnce([oeffentlich, undefined]);
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(
                OrganisationsTyp.KLASSE,
                'oeffentlichId',
            );

            expect(result).toBe(true);
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(
                person.id,
                'oeffentlichId',
                RollenSystemRecht.KLASSEN_VERWALTEN,
            );
        });

        it('should return true if person has KLASSEN_VERWALTEN Recht at the oeffentlich organisation', async () => {
            const person: Person<true> = createPerson();
            const oeffentlich: Organisation<true> = createMock<Organisation<true>>({ id: 'oeffentlichId' });
            organisationRepoMock.findRootDirectChildren.mockResolvedValueOnce([oeffentlich, undefined]);
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(OrganisationsTyp.KLASSE);

            expect(result).toBe(true);
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(
                person.id,
                'oeffentlichId',
                RollenSystemRecht.KLASSEN_VERWALTEN,
            );
        });

        it('should return true if person has KLASSEN_VERWALTEN Recht at the root organisation', async () => {
            const person: Person<true> = createPerson();
            organisationRepoMock.findRootDirectChildren.mockResolvedValueOnce([undefined, undefined]);
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(OrganisationsTyp.KLASSE);

            expect(result).toBe(true);
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(
                person.id,
                organisationRepoMock.ROOT_ORGANISATION_ID,
                RollenSystemRecht.KLASSEN_VERWALTEN,
            );
        });

        it('should return true if person has SCHULEN_VERWALTEN Recht at the root organisation', async () => {
            const person: Person<true> = createPerson();
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(OrganisationsTyp.SCHULE);

            expect(result).toBe(true);
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(
                person.id,
                organisationRepoMock.ROOT_ORGANISATION_ID,
                RollenSystemRecht.SCHULEN_VERWALTEN,
            );
        });

        it('should return true if person has SCHULTRAEGER_VERWALTEN Recht at the root organisation', async () => {
            const person: Person<true> = createPerson();
            dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(OrganisationsTyp.TRAEGER);

            expect(result).toBe(true);
            expect(dbiamPersonenkontextRepoMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(
                person.id,
                organisationRepoMock.ROOT_ORGANISATION_ID,
                RollenSystemRecht.SCHULTRAEGER_VERWALTEN,
            );
        });

        it('should return false if organisation type is not KLASSE or SCHULE', async () => {
            const person: Person<true> = createPerson();

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: boolean = await personPermissions.hasOrgVerwaltenRechtAtOrga(OrganisationsTyp.SONSTIGE);

            expect(result).toBe(false);
        });
    });

    describe('getAssignedServiceProviderIdsFromErweiterungen', () => {
        it('should return an array of service provider IDs', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                serviceProviderIds: [faker.string.uuid(), faker.string.uuid()],
            });
            const personenkontext: Personenkontext<true> = DoFactory.createPersonenkontext(true, {
                personId: person.id,
                organisationId: organisation.id,
                rolleId: rolle.id,
            });
            const rollenerweiterungServiceProviderIds: ServiceProviderID[] = [
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            ];
            rollenerweiterungRepoMock.findManyByOrganisationAndRolle.mockResolvedValueOnce(
                rollenerweiterungServiceProviderIds.map((serviceProviderId: ServiceProviderID) =>
                    DoFactory.createRollenerweiterung(true, {
                        organisationId: organisation.id,
                        rolleId: rolle.id,
                        serviceProviderId,
                    }),
                ),
            );
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce([personenkontext]); // getPersonenkontextFields
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: Array<ServiceProviderID> =
                await personPermissions.getAssignedServiceProviderIdsFromErweiterungen();

            expect(rollenerweiterungRepoMock.findManyByOrganisationAndRolle).toHaveBeenCalledWith([
                {
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                },
            ]);
            expect(result).toEqual(expect.arrayContaining(rollenerweiterungServiceProviderIds));
            expect(result).toHaveLength(rollenerweiterungServiceProviderIds.length);
        });

        it('should return an array of service provider IDs if multiple rollenerweiterungen exist', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            const organisation1: Organisation<true> = DoFactory.createOrganisation(true);
            const organisation2: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle1: Rolle<true> = DoFactory.createRolle(true, {
                serviceProviderIds: [faker.string.uuid(), faker.string.uuid()],
            });
            const rolle2: Rolle<true> = DoFactory.createRolle(true, {
                serviceProviderIds: [faker.string.uuid(), faker.string.uuid()],
            });
            const personenkontexte: Array<Personenkontext<true>> = [
                DoFactory.createPersonenkontext(true, {
                    personId: person.id,
                    organisationId: organisation1.id,
                    rolleId: rolle1.id,
                }),
                DoFactory.createPersonenkontext(true, {
                    personId: person.id,
                    organisationId: organisation2.id,
                    rolleId: rolle1.id,
                }),
                DoFactory.createPersonenkontext(true, {
                    personId: person.id,
                    organisationId: organisation2.id,
                    rolleId: rolle2.id,
                }),
            ];
            const rollenerweiterung1ServiceProviderIds: ServiceProviderID[] = [
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            ];
            const rollenerweiterung2ServiceProviderIds: ServiceProviderID[] = [
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            ];
            rollenerweiterungRepoMock.findManyByOrganisationAndRolle.mockResolvedValueOnce(
                rollenerweiterung1ServiceProviderIds
                    .map((serviceProviderId: ServiceProviderID) =>
                        DoFactory.createRollenerweiterung(true, {
                            organisationId: organisation1.id,
                            rolleId: rolle1.id,
                            serviceProviderId,
                        }),
                    )
                    .concat(
                        rollenerweiterung1ServiceProviderIds.map((serviceProviderId: ServiceProviderID) =>
                            DoFactory.createRollenerweiterung(true, {
                                organisationId: organisation2.id,
                                rolleId: rolle1.id,
                                serviceProviderId,
                            }),
                        ),
                    )
                    .concat(
                        rollenerweiterung2ServiceProviderIds.map((serviceProviderId: ServiceProviderID) =>
                            DoFactory.createRollenerweiterung(true, {
                                organisationId: organisation2.id,
                                rolleId: rolle2.id,
                                serviceProviderId,
                            }),
                        ),
                    ),
            );
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte); // getPersonenkontextFields
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                rollenerweiterungRepoMock,
                person,
            );

            const result: Array<ServiceProviderID> =
                await personPermissions.getAssignedServiceProviderIdsFromErweiterungen();

            expect(rollenerweiterungRepoMock.findManyByOrganisationAndRolle).toHaveBeenCalledWith(
                personenkontexte.map((pk: Personenkontext<true>) => ({
                    organisationId: pk.organisationId,
                    rolleId: pk.rolleId,
                })),
            );
            expect(result).toEqual(expect.arrayContaining(rollenerweiterung1ServiceProviderIds));
            expect(result).toEqual(expect.arrayContaining(rollenerweiterung2ServiceProviderIds));
            expect(result).toHaveLength(
                rollenerweiterung1ServiceProviderIds.length + rollenerweiterung2ServiceProviderIds.length,
            );
        });
    });
});
