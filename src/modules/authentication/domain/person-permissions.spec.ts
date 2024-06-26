import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/index.js';
import { PersonPermissionsRepo } from './person-permission.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Person } from '../../person/domain/person.js';
import { PersonFields, PersonPermissions } from './person-permissions.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { OrganisationID, RolleID } from '../../../shared/types/index.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonenkontextRolleFieldsResponse } from '../api/personen-kontext-rolle-fields.response.js';
import { RollenSystemRechtServiceProviderIDResponse } from '../api/rolle-systemrechte-serviceproviderid.response.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

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
                PersonenkontextFactory,
            ],
        }).compile();

        dbiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        rolleRepoMock = module.get(RolleRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('getRoleIds', () => {
        describe('when person can be found', () => {
            it('should load PersonPermissions', async () => {
                const person: Person<true> = createPerson();
                const personenkontexte: Personenkontext<true>[] = [
                    personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
                ];
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                const personPermissions: PersonPermissions = new PersonPermissions(
                    dbiamPersonenkontextRepoMock,
                    organisationRepoMock,
                    rolleRepoMock,
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
                const personenkontexte: Personenkontext<true>[] = [
                    personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
                ];
                dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
                const personPermissions: PersonPermissions = new PersonPermissions(
                    dbiamPersonenkontextRepoMock,
                    organisationRepoMock,
                    rolleRepoMock,
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
        it('should return organisations', async () => {
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
            const personenkontexte: Personenkontext<true>[] = [
                personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
            ];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                createMock<OrganisationDo<true>>({ id: '2' }),
            ]);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            const ids: OrganisationID[] = await personPermissions.getOrgIdsWithSystemrecht(
                [RollenSystemRecht.PERSONEN_VERWALTEN],
                true,
            );
            expect(ids).toContain('1');
            expect(ids).toContain('2');
        });
    });

    describe('getOrgIdsWithSystemrecht without Children', () => {
        it('should return organisations', async () => {
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
            const personenkontexte: Personenkontext<true>[] = [
                personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
            ];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            const ids: OrganisationID[] = await personPermissions.getOrgIdsWithSystemrecht([]);
            expect(ids).toContain('1');
        });
    });

    describe('getPersonenkontextewithRoles', () => {
        it('should return person context with system rights and service provider ids in an object roles', async () => {
            const person: Person<true> = createPerson();
            const personenkontexte: Personenkontext<true>[] = [
                personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
            ];
            const expectedRolle: Rolle<true> = createMock<Rolle<true>>({ hasSystemRecht: () => true });
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map([['1', expectedRolle]]));

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            const result: PersonenkontextRolleFieldsResponse[] = await personPermissions.getPersonenkontextewithRoles();

            const expected: PersonenkontextRolleFieldsResponse[] = personenkontexte.map(
                (pk: Personenkontext<true>) => ({
                    organisationsId: pk.organisationId,
                    rolle: {
                        systemrechte: expectedRolle.systemrechte,
                        serviceProviderIds: expectedRolle.serviceProviderIds,
                    },
                }),
            );

            expect(result).toEqual(expected);
        });
    });

    describe('PersonenkontextRolleFieldsResponse', () => {
        it('should create a valid PersonenkontextRolleFieldsResponse object', () => {
            const rollenSystemRechtServiceProviderID: RollenSystemRechtServiceProviderIDResponse =
                new RollenSystemRechtServiceProviderIDResponse(['right1', 'right2'], ['service1', 'service2']);
            const response: PersonenkontextRolleFieldsResponse = new PersonenkontextRolleFieldsResponse(
                'testOrgId',
                rollenSystemRechtServiceProviderID,
            );

            expect(response.organisationsId).toEqual('testOrgId');
            expect(response.rolle.systemrechte).toEqual(['right1', 'right2']);
            expect(response.rolle.serviceProviderIds).toEqual(['service1', 'service2']);
        });
    });

    describe('hasSystemrechtAtOrganisation', () => {
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
            const personenkontexte: Personenkontext<true>[] = [
                personenkontextFactory.construct('1', faker.date.past(), faker.date.recent(), '1', '1', '1'),
            ];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                createMock<OrganisationDo<true>>({ id: '2' }),
            ]);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            const result: boolean = await personPermissions.hasSystemrechtAtOrganisation('2', [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            expect(result).toBe(true);
        });
    });

    describe('hasSystemrechtAtOrganisation', () => {
        it('should return true if person has the recht at the root', async () => {
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
            const personenkontexte: Personenkontext<true>[] = [
                personenkontextFactory.construct(
                    '1',
                    faker.date.past(),
                    faker.date.recent(),
                    '1',
                    organisationRepoMock.ROOT_ORGANISATION_ID,
                    '1',
                ),
            ];
            dbiamPersonenkontextRepoMock.findByPerson.mockResolvedValueOnce(personenkontexte);
            rolleRepoMock.findByIds.mockResolvedValueOnce(
                new Map([['1', createMock<Rolle<true>>({ hasSystemRecht: () => true })]]),
            );
            organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([
                createMock<OrganisationDo<true>>({ id: organisationRepoMock.ROOT_ORGANISATION_ID }),
            ]);

            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            const result: boolean = await personPermissions.hasSystemrechtAtRootOrganisation([
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            expect(result).toBe(true);
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
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechtAtRootOrganisation').mockResolvedValueOnce(true);

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
            dbiamPersonenkontextRepoMock.findByPersonAuthorized.mockResolvedValueOnce({
                ok: false,
                error: createMock(),
            });
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechtAtRootOrganisation').mockResolvedValueOnce(false);

            const result: boolean = await personPermissions.canModifyPerson('2');

            expect(result).toBe(false);
        });

        it('should return false, if person does not have organisations in common with target', async () => {
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
            dbiamPersonenkontextRepoMock.findByPersonAuthorized.mockResolvedValueOnce({
                ok: true,
                value: [],
            });
            const personPermissions: PersonPermissions = new PersonPermissions(
                dbiamPersonenkontextRepoMock,
                organisationRepoMock,
                rolleRepoMock,
                person,
            );
            jest.spyOn(personPermissions, 'hasSystemrechtAtRootOrganisation').mockResolvedValueOnce(false);

            const result: boolean = await personPermissions.canModifyPerson('2');

            expect(result).toBe(false);
        });
    });
});
