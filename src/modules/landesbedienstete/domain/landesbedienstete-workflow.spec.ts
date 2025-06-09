import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonLandesbediensteterSearchService } from '../../person/person-landesbedienstete-search/person-landesbediensteter-search.service.js';
import { DbiamPersonenkontextBodyParams } from '../../personenkontext/api/param/dbiam-personenkontext.body.params.js';
import { DbiamPersonenkontextFactory } from '../../personenkontext/domain/dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontexteUpdate } from '../../personenkontext/domain/personenkontexte-update.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleNurAnPassendeOrganisationError } from '../../personenkontext/specification/error/rolle-nur-an-passende-organisation.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { LandesbediensteteWorkflowFactory } from './landesbedienstete-workflow.factory.js';
import { LandesbediensteteWorkflowAggregate } from './landesbedienstete-workflow.js';

describe('LandesbediensteteWorkflow', () => {
    let module: TestingModule;

    let sut: LandesbediensteteWorkflowAggregate;

    let factory: LandesbediensteteWorkflowFactory;

    const personRepoMock: DeepMocked<PersonRepository> = createMock();
    const rolleRepoMock: DeepMocked<RolleRepo> = createMock();
    const organisationRepoMock: DeepMocked<OrganisationRepository> = createMock();
    const personenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo> = createMock();
    const personenkontextFactoryMock: DeepMocked<DbiamPersonenkontextFactory> = createMock();
    const landesbediensteteServiceMock: DeepMocked<PersonLandesbediensteterSearchService> = createMock();

    function mockCheckPermissions(permissionsMock: DeepMocked<PersonPermissions>, success: boolean): void {
        permissionsMock.hasSystemrechteAtOrganisation.mockResolvedValueOnce(success);
    }

    function mockCheckReferences(success: boolean): void {
        if (success) {
            const mockOrga: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const mockRolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.LEHR,
                canBeAssignedToOrga() {
                    return Promise.resolve(true);
                },
            });

            organisationRepoMock.findById.mockResolvedValueOnce(mockOrga);
            rolleRepoMock.findById.mockResolvedValueOnce(mockRolle);
        } else {
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);
        }
    }

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                LandesbediensteteWorkflowFactory,
                { provide: PersonRepository, useValue: personRepoMock },
                { provide: RolleRepo, useValue: rolleRepoMock },
                { provide: OrganisationRepository, useValue: organisationRepoMock },
                { provide: DBiamPersonenkontextRepo, useValue: personenkontextRepoMock },
                { provide: DbiamPersonenkontextFactory, useValue: personenkontextFactoryMock },
                { provide: PersonLandesbediensteterSearchService, useValue: landesbediensteteServiceMock },
            ],
        }).compile();

        factory = module.get(LandesbediensteteWorkflowFactory);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        sut = factory.createNew();
    });

    describe('findAllSchulstrukturknoten', () => {
        it('should return empty array if not allowed', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [] });

            const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                permissions,
                undefined,
                undefined,
                undefined,
            );

            expect(result).toHaveLength(0);
        });

        it('should return empty array if no valid orgas found', async () => {
            const orgaName: string = faker.word.noun();

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValueOnce([]);

            const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                permissions,
                orgaName,
                undefined,
                25,
            );

            expect(organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType).toHaveBeenCalledWith(
                OrganisationsTyp.KLASSE,
                orgaName,
                undefined,
                25,
            );
            expect(result).toHaveLength(0);
        });

        it('should return empty array if no valid orgas found', async () => {
            const orgaName: string = faker.word.noun();
            const orgaId: string = faker.string.uuid();

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [orgaId] });
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValueOnce([]);

            const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                permissions,
                orgaName,
                undefined,
                25,
            );

            expect(organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType).toHaveBeenCalledWith(
                OrganisationsTyp.KLASSE,
                orgaName,
                [orgaId],
                25,
            );
            expect(result).toHaveLength(0);
        });

        it('should only return matching orgas', async () => {
            const orgaA: Organisation<true> = DoFactory.createOrganisation(true);
            const orgaB: Organisation<true> = DoFactory.createOrganisation(true);

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [orgaA.id, orgaB.id] });
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValueOnce([orgaA]);

            const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                permissions,
                orgaA.name,
                undefined,
                25,
            );

            expect(organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType).toHaveBeenCalledWith(
                OrganisationsTyp.KLASSE,
                orgaA.name,
                [orgaA.id, orgaB.id],
                25,
            );
            expect(result).toHaveLength(1);
        });

        it('should fetch requested organisation if they were not included in the search', async () => {
            const orgaA: Organisation<true> = DoFactory.createOrganisation(true);
            const orgaB: Organisation<true> = DoFactory.createOrganisation(true);

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [orgaA.id] });
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValueOnce([orgaA]);
            organisationRepoMock.findById.mockResolvedValueOnce(orgaB);

            sut.initialize(orgaB.id, []);

            const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                permissions,
                orgaA.name,
                undefined,
                25,
            );

            expect(result).toHaveLength(2);
        });

        describe('special cases', () => {
            it('should correctly sort organisations', async () => {
                const orgas: Organisation<true>[] = [
                    DoFactory.createOrganisation(true, { name: undefined }),
                    DoFactory.createOrganisation(true, { kennung: undefined }),
                    DoFactory.createOrganisation(true),
                    DoFactory.createOrganisation(true, { name: undefined }),
                    DoFactory.createOrganisation(true, { kennung: undefined }),
                    DoFactory.createOrganisation(true, { name: undefined }),
                    DoFactory.createOrganisation(true),
                ];

                const permissions: DeepMocked<PersonPermissions> = createMock();
                permissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                    all: false,
                    orgaIds: orgas.map((o: Organisation<true>) => o.id),
                });
                organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValueOnce(orgas);

                const result: Organisation<true>[] = await sut.findAllSchulstrukturknoten(
                    permissions,
                    undefined,
                    undefined,
                    25,
                );

                expect(result).toHaveLength(orgas.length);
            });
        });
    });

    describe('findRollenForOrganisation', () => {
        it('should return empty array if not allowed', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            sut.initialize(faker.string.uuid(), []);

            const result: Rolle<true>[] = await sut.findRollenForOrganisation(permissions, undefined, 25);

            expect(result).toHaveLength(0);
        });

        it('should return empty array if organisation could not be found', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);

            sut.initialize(faker.string.uuid(), []);

            const result: Rolle<true>[] = await sut.findRollenForOrganisation(permissions, undefined, 25);

            expect(result).toHaveLength(0);
        });

        it('should work if rollen name is given', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true);

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.findByName.mockResolvedValueOnce([rolle]);

            mockCheckReferences(true);

            sut.initialize(faker.string.uuid(), []);

            const result: Rolle<true>[] = await sut.findRollenForOrganisation(permissions, rolle.name, 25);

            expect(result).toHaveLength(1);
        });

        it('should only return allowed rollen', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rollen: Rolle<true>[] = [
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
                DoFactory.createRolle(true),
            ];

            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.find.mockResolvedValueOnce(rollen);

            // One of the rollen is not assignable
            mockCheckReferences(true);
            mockCheckReferences(true);
            mockCheckReferences(false);

            sut.initialize(faker.string.uuid(), []);

            const result: Rolle<true>[] = await sut.findRollenForOrganisation(permissions, undefined, 25);

            expect(result).toHaveLength(2);
        });
    });

    describe('canCommit', () => {
        it('should return no error if checks pass', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            mockCheckReferences(true);
            mockCheckPermissions(permissions, true);
            sut.initialize(faker.string.uuid(), [faker.string.uuid()]);

            const result: Result<void, DomainError> = await sut.canCommit(permissions);

            expect(result).toEqual({ ok: true, value: undefined });
        });

        it('should return error if rolle can not be assigned', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            mockCheckReferences(false);
            sut.initialize(faker.string.uuid(), [faker.string.uuid()]);

            const result: Result<void, DomainError> = await sut.canCommit(permissions);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expect(result).toEqual({ ok: false, error: expect.any(DomainError) });
        });

        it('should return error if permissions are missing', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock();
            mockCheckReferences(true);
            mockCheckPermissions(permissions, false);
            sut.initialize(faker.string.uuid(), [faker.string.uuid()]);

            const result: Result<void, DomainError> = await sut.canCommit(permissions);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expect(result).toEqual({ ok: false, error: expect.any(DomainError) });
        });
    });

    describe('commit', () => {
        it('should use PersonenkontexteUpdate', async () => {
            const personId: string = faker.string.uuid();
            const lastModified: Date = new Date();
            const count: number = 0;
            const newPersonenkontexte: DbiamPersonenkontextBodyParams[] = [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ];
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            const personalnummer: string = faker.string.numeric(7);
            personRepoMock.findById.mockResolvedValueOnce(DoFactory.createPerson(true));
            landesbediensteteServiceMock.personIsSearchable.mockResolvedValueOnce({ ok: true, value: undefined });

            const pkupdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
            personenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(pkupdateMock);

            await sut.commit(personId, lastModified, count, newPersonenkontexte, permissions, personalnummer);

            expect(pkupdateMock.update).toHaveBeenCalled();
        });

        it('should return error if missing permissions on orga', async () => {
            const personId: string = faker.string.uuid();
            const lastModified: Date = new Date();
            const count: number = 0;
            const newPersonenkontexte: DbiamPersonenkontextBodyParams[] = [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ];
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            const personalnummer: string = faker.string.numeric(7);

            const pkupdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
            personenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(pkupdateMock);

            const result: Result<Personenkontext<true>[], PersonenkontexteUpdateError> = await sut.commit(
                personId,
                lastModified,
                count,
                newPersonenkontexte,
                permissions,
                personalnummer,
            );

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError(
                    'Not allowed to add Landesbedienstete to the requested organisations.',
                ),
            });
        });

        it('should return error if person can not be found', async () => {
            const personId: string = faker.string.uuid();
            const lastModified: Date = new Date();
            const count: number = 0;
            const newPersonenkontexte: DbiamPersonenkontextBodyParams[] = [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ];
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            const personalnummer: string = faker.string.numeric(7);
            personRepoMock.findById.mockResolvedValueOnce(undefined);

            const pkupdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
            personenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(pkupdateMock);

            const result: Result<Personenkontext<true>[], PersonenkontexteUpdateError> = await sut.commit(
                personId,
                lastModified,
                count,
                newPersonenkontexte,
                permissions,
                personalnummer,
            );

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Person', personId),
            });
        });

        it('should return error if person is not allowed to be searched for', async () => {
            const person: Person<true> = DoFactory.createPerson(true);
            const lastModified: Date = new Date();
            const count: number = 0;
            const newPersonenkontexte: DbiamPersonenkontextBodyParams[] = [
                {
                    organisationId: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    rolleId: faker.string.uuid(),
                },
            ];
            const permissions: DeepMocked<PersonPermissions> = createMock();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            const personalnummer: string = faker.string.numeric(7);
            personRepoMock.findById.mockResolvedValueOnce(person);
            landesbediensteteServiceMock.personIsSearchable.mockResolvedValueOnce({
                ok: false,
                error: new EntityNotFoundError('Test Error'),
            });

            const pkupdateMock: DeepMocked<PersonenkontexteUpdate> = createMock();

            personenkontextRepoMock.findByPerson.mockResolvedValueOnce([]);
            personenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValueOnce(pkupdateMock);

            const result: Result<Personenkontext<true>[], PersonenkontexteUpdateError> = await sut.commit(
                person.id,
                lastModified,
                count,
                newPersonenkontexte,
                permissions,
                personalnummer,
            );

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Person', person.id),
            });
        });
    });

    describe('checkReferences', () => {
        it('should return error if organisation could not be found', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            organisationRepoMock.findById.mockResolvedValueOnce(undefined);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            const result: Option<DomainError> = await sut.checkReferences(orga.id, rolle.id);

            expect(result).toEqual(new EntityNotFoundError('Organisation', orga.id));
        });

        it('should return error if rolle could not be found', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.findById.mockResolvedValueOnce(undefined);

            const result: Option<DomainError> = await sut.checkReferences(orga.id, rolle.id);

            expect(result).toEqual(new EntityNotFoundError('Rolle', rolle.id));
        });

        it('should return error if rolle can not be assigned', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true);
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                canBeAssignedToOrga: () => Promise.resolve(false),
            });
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            const result: Option<DomainError> = await sut.checkReferences(orga.id, rolle.id);

            expect(result).toEqual(new EntityNotFoundError('Rolle', rolle.id));
        });

        it('should return error if rollenart does not match organisation', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.SYSADMIN,
                canBeAssignedToOrga: () => Promise.resolve(true),
            });
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            const result: Option<DomainError> = await sut.checkReferences(orga.id, rolle.id);

            expect(result).toEqual(new RolleNurAnPassendeOrganisationError());
        });

        it('should return no error if everything is okay', async () => {
            const orga: Organisation<true> = DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.LEHR,
                canBeAssignedToOrga: () => Promise.resolve(true),
            });
            organisationRepoMock.findById.mockResolvedValueOnce(orga);
            rolleRepoMock.findById.mockResolvedValueOnce(rolle);

            const result: Option<DomainError> = await sut.checkReferences(orga.id, rolle.id);

            expect(result).toBeUndefined();
        });
    });
});
