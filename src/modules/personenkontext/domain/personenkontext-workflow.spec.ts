import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { DbiamPersonenkontextBodyParams } from '../api/param/dbiam-personenkontext.body.params.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontextWorkflowSharedKernel } from './personenkontext-workflow-shared-kernel.js';
import { PersonenkontextWorkflowFactory } from './personenkontext-workflow.factory.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { OperationContext } from './personenkontext.enums.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { Personenkontext } from './personenkontext.js';

describe('PersonenkontextWorkflow', () => {
    let module: TestingModule;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let anlage: PersonenkontextWorkflowAggregate;
    let personenkontextKontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personenkontextAnlageFactory: PersonenkontextWorkflowFactory;
    let personpermissionsMock: DeepMocked<PersonPermissions>;
    let dbiamPersonenkontextFactoryMock: DeepMocked<DbiamPersonenkontextFactory>;
    let configMock: DeepMocked<ConfigService>;
    let personenkontextWorkflowSharedKernelMock: DeepMocked<PersonenkontextWorkflowSharedKernel>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextWorkflowFactory,
                PersonenkontextFactory,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
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
                    provide: PersonPermissions,
                    useValue: createMock<PersonPermissions>(),
                },
                {
                    provide: DbiamPersonenkontextFactory,
                    useValue: createMock<DbiamPersonenkontextFactory>(),
                },
                {
                    provide: ConfigService,
                    useValue: createMock<ConfigService>(),
                },
                {
                    provide: PersonenkontextWorkflowSharedKernel,
                    useValue: createMock<PersonenkontextWorkflowSharedKernel>(),
                },
            ],
        }).compile();
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepository);
        dbiamPersonenkontextFactoryMock = module.get(DbiamPersonenkontextFactory);
        personenkontextAnlageFactory = module.get(PersonenkontextWorkflowFactory);
        personenkontextKontextRepoMock = module.get(DBiamPersonenkontextRepo);
        anlage = personenkontextAnlageFactory.createNew();
        personpermissionsMock = module.get(PersonPermissions);
        configMock = module.get(ConfigService);
        personenkontextWorkflowSharedKernelMock = module.get(PersonenkontextWorkflowSharedKernel);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(anlage).toBeDefined();
    });

    describe('initialize', () => {
        it('should initialize the aggregate with the selected Organisation and Rolle', () => {
            anlage.initialize('person-id', 'org-id', ['role-id']);
            expect(anlage.personId).toBe('person-id');
            expect(anlage.selectedOrganisationId).toBe('org-id');
            expect(anlage.selectedRolleIds).toStrictEqual(['role-id']);
        });
    });

    describe('findAllSchulstrukturknoten', () => {
        it('should return only the organisations that the admin has rights on', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const organisations: Organisation<true>[] = [organisation];
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue(organisations);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                all: false,
                orgaIds: [organisation.id],
            });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );
            expect(result.length).toBe(2);
        });

        it('should return organisations based on name or kennung if provided', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const organisations: Organisation<true>[] = [organisation];
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue(organisations);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                all: false,
                orgaIds: [organisation.id],
            });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                organisation.name,
            );
            expect(result.length).toBe(1);
        });

        it('should return an empty array if no organisations are found', async () => {
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [] });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );
            expect(result.length).toBe(0);
        });

        it('should sort organisations by name and kennung', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                kennung: 'K1',
                name: 'Beta School',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                kennung: 'K2',
                name: 'Alpha School',
            });
            const org3: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Gamma School' });
            const org4: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K3' });
            const orgsWithRecht: string[] = [org1.id, org2.id, org3.id, org4.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([
                org1,
                org2,
                org3,
                org4,
            ]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(4);
        });

        it('should sort organisations with only kennung defined', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K2' });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K1' });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(2);
        });

        it('should handle organisations with undefined kennung and name', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K1' });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Alpha School' });
            const org3: Organisation<true> = DoFactory.createOrganisation(true, {});
            const orgsWithRecht: string[] = [org1.id, org2.id, org3.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2, org3]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(3);
        });

        it('should handle organisations with kennung but undefined name', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K1', name: 'tootie' });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { name: undefined });
            const org3: Organisation<true> = DoFactory.createOrganisation(true, {});
            const orgsWithRecht: string[] = [org1.id, org2.id, org3.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2, org3]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(3);
        });

        it('should handle organisations with name but undefined kennung', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                kennung: undefined,
                name: 'rolle',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { name: 'tootie' });
            const org3: Organisation<true> = DoFactory.createOrganisation(true, {});
            const orgsWithRecht: string[] = [org1.id, org2.id, org3.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2, org3]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(3);
        });
        it('should sort organisations with neither kennung nor name defined', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {});
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {});
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(2);
        });

        it('should handle mixed cases of kennung and name', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                kennung: 'K2',
                name: 'Beta School',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Alpha School' });
            const org3: Organisation<true> = DoFactory.createOrganisation(true, { kennung: 'K1' });
            const org4: Organisation<true> = DoFactory.createOrganisation(true, {});
            const orgsWithRecht: string[] = [org1.id, org2.id, org3.id, org4.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([
                org1,
                org2,
                org3,
                org4,
            ]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(4);
        });

        it('should sort organisations with only name defined', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Beta School' });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Alpha School' });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(2);
        });
        it('should handle organisations with neither kennung nor name defined and return them as equal', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: undefined,
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: undefined,
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });
        it('should handle organisations with kennung defined but name undefined', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: '123',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: '123',
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });
        it('should handle organisations with kennung defined but name undefined', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: undefined,
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: undefined,
                kennung: '123',
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });
        it('should handle organisations with name and kennung', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Carl-Orff',
                kennung: '123',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Amalie',
                kennung: '321',
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });
        it('should handle organisations with name and kennung', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Carl-Orff',
                kennung: undefined,
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Amalie',
                kennung: '321',
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });
        it('should handle organisations with name and kennung', async () => {
            const org1: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Carl-Orff',
                kennung: '321',
            });
            const org2: Organisation<true> = DoFactory.createOrganisation(true, {
                name: 'Amalie',
                kennung: undefined,
            });
            const orgsWithRecht: string[] = [org1.id, org2.id];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([org1, org2]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: orgsWithRecht });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toEqual(2);
        });

        it('should call findByNameOrKennungAndExcludeByOrganisationType with undefined orgaIds when all permissions are granted', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const organisations: Organisation<true>[] = [organisation];

            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue(organisations);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: true,
            });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            // Ensure that the method is called with undefined orgaIds
            expect(organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType).toHaveBeenCalledWith(
                OrganisationsTyp.KLASSE,
                undefined,
                undefined,
                undefined,
            );

            expect(result).toEqual(organisations);
        });

        it('should return an empty array if no organisations are found', async () => {
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([]);
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: ['someId'] });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            expect(result.length).toBe(0); // Verify that the result is empty
        });

        it('should filter organisations by permittedOrgaIds when all permissions are not granted', async () => {
            const organisation1: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Org 1' });
            const organisation2: Organisation<true> = DoFactory.createOrganisation(true, { name: 'Org 2' });
            const permittedOrgaIds: string[] = [organisation1.id]; // Only Org 1 is permitted

            // Mock the repository to return both organisations
            organisationRepoMock.findByNameOrKennungAndExcludeByOrganisationType.mockResolvedValue([
                organisation1,
                organisation2,
            ]);

            // Mock permissions to indicate that all organisations are not permitted
            personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                all: false,
                orgaIds: permittedOrgaIds, // Only permit Org 1
            });

            const result: Organisation<true>[] = await anlage.findAllSchulstrukturknoten(
                personpermissionsMock,
                undefined,
            );

            // Ensure only the permitted organisation is returned
            expect(result.length).toEqual(1); // Only Org 1 should be returned
        });
    });

    describe('findRollenForOrganisation', () => {
        it('should return an empty array if no roles are found by name', async () => {
            anlage.initialize(undefined, 'organisation-id');
            rolleRepoMock.findByName.mockResolvedValue([]);
            const organisation: Organisation<true> = createMock<Organisation<true>>();
            organisationRepoMock.findById.mockResolvedValue(organisation);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(
                createMock<PersonPermissions>(),
                'rolle-name',
                [],
                10,
            );

            expect(result).toEqual([]);
        });

        it('should return an empty array if no personId is set but permissions are missing', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.canModifyPerson.mockResolvedValue(false);

            anlage.initialize('person-id', 'organisation-id');

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toEqual([]);
        });

        it('should return an empty array if no organisations with system rights are found', async () => {
            rolleRepoMock.find.mockResolvedValue([createMock<Rolle<true>>()]);
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            anlage.initialize(undefined, 'organisation-id');

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toEqual([]);
        });

        it('should return an empty array if the organisation is not found', async () => {
            const rolle: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            rolleRepoMock.find.mockResolvedValue([createMock<Rolle<true>>()]);
            rolleRepoMock.find.mockResolvedValue([rolle]);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            organisationRepoMock.findById.mockResolvedValue(undefined);

            anlage.initialize(undefined, 'org-id');

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toEqual([]);
        });

        it('should return an empty array if user does not have permission to view roles for the organisation', async () => {
            const rolle: DeepMocked<Rolle<true>> = createMock<Rolle<true>>();
            const organisation: DeepMocked<Organisation<true>> = createMock<Organisation<true>>();
            rolleRepoMock.find.mockResolvedValue([rolle]);
            organisationRepoMock.findById.mockResolvedValue(organisation);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtOrganisation.mockResolvedValue(false);

            anlage.initialize(undefined, 'organisation-id');

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toEqual([]);
        });

        it('should add roles to allowedRollen if user has permissions', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.LAND,
            });
            const childOrganisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
            });
            const rolle: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'Alpha',
            });
            const rolle1: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'Beta',
            });
            const rollen: Rolle<true>[] = [rolle, rolle1];
            const orgsWithRecht: string[] = [organisation.id, childOrganisation.id];

            organisationRepoMock.findById.mockResolvedValue(organisation);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValue([childOrganisation]);
            organisationRepoMock.findByIds.mockResolvedValue(
                new Map(orgsWithRecht.map((id: string) => [id, DoFactory.createOrganisation(true, { id })])),
            );
            rolleRepoMock.find.mockResolvedValue(rollen);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtOrganisation.mockResolvedValue(true);

            personenkontextWorkflowSharedKernelMock.checkReferences.mockResolvedValue(undefined);

            anlage.initialize(undefined, organisation.id);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toHaveLength(2);
        });

        it('should limit allowedRollen based on set personId', async () => {
            rolleRepoMock.find.mockResolvedValue([]);

            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepoMock.findById.mockResolvedValue(organisation);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            permissions.canModifyPerson.mockResolvedValueOnce(true);

            personenkontextKontextRepoMock.findByPerson.mockResolvedValueOnce([DoFactory.createPersonenkontext(true)]);

            const personRollen: Rolle<true>[] = [DoFactory.createRolle(true)];
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map(personRollen.map((r: Rolle<true>) => [r.id, r])));

            anlage.initialize('person-id', organisation.id);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toHaveLength(0);
        });

        it('should limit allowedRollen based on set personId when rollenarten are passed in', async () => {
            rolleRepoMock.find.mockResolvedValue([]);

            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepoMock.findById.mockResolvedValue(organisation);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            permissions.canModifyPerson.mockResolvedValueOnce(true);

            personenkontextKontextRepoMock.findByPerson.mockResolvedValueOnce([DoFactory.createPersonenkontext(true)]);

            const personRollen: Rolle<true>[] = [DoFactory.createRolle(true)];
            rolleRepoMock.findByIds.mockResolvedValueOnce(new Map(personRollen.map((r: Rolle<true>) => [r.id, r])));

            anlage.initialize('person-id', organisation.id);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(
                permissions,
                undefined,
                undefined,
                undefined,
                [RollenArt.LEHR],
            );

            expect(result).toHaveLength(0);
        });

        it('should handle empty roles array', async () => {
            rolleRepoMock.find.mockResolvedValue([]);

            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisationRepoMock.findById.mockResolvedValue(organisation);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            anlage.initialize(undefined, organisation.id);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            expect(result).toHaveLength(0);
        });

        it('should limit roles returned allowedRollen if limit is set', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.LAND,
            });
            const childOrganisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
            });
            const rolle1: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle1',
            });
            const rolle2: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle2',
            });
            const rolle3: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle3',
            });
            const rolle4: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle4',
            });
            const rollen: Rolle<true>[] = [rolle1, rolle2, rolle3, rolle4];
            const orgsWithRecht: string[] = [organisation.id, childOrganisation.id];

            organisationRepoMock.findById.mockResolvedValue(organisation);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValue([childOrganisation]);
            organisationRepoMock.findByIds.mockResolvedValue(
                new Map(orgsWithRecht.map((id: string) => [id, DoFactory.createOrganisation(true, { id })])),
            );
            rolleRepoMock.find.mockResolvedValue(rollen);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            organisationRepoMock.findById.mockResolvedValue(organisation);
            rolleRepoMock.findById.mockResolvedValue(rolle1);

            anlage.initialize(undefined, organisation.id);

            jest.spyOn(anlage, 'checkReferences').mockResolvedValue(undefined);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions, undefined, [], 2);

            expect(result).toHaveLength(2);
        });

        it('should filter out roles that do not pass the reference check', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.LAND,
            });
            const childOrganisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
            });
            const rolle1: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle1',
            });
            const rolle2: Rolle<true> = DoFactory.createRolle(true, {
                rollenart: RollenArt.ORGADMIN,
                name: 'rolle2',
            });
            const rollen: Rolle<true>[] = [rolle1, rolle2];
            const orgsWithRecht: string[] = [organisation.id, childOrganisation.id];

            organisationRepoMock.findById.mockResolvedValue(organisation);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValue([childOrganisation]);
            organisationRepoMock.findByIds.mockResolvedValue(
                new Map(orgsWithRecht.map((id: string) => [id, DoFactory.createOrganisation(true, { id })])),
            );
            rolleRepoMock.find.mockResolvedValue(rollen);

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            organisationRepoMock.findById.mockResolvedValue(organisation);
            rolleRepoMock.findById.mockResolvedValue(rolle1);

            anlage.initialize(undefined, organisation.id);

            const mockDomainError: DomainError = {
                name: 'ReferenceCheckError',
                message: 'Some error message',
                code: 'ERROR_CODE',
            };

            // Mock checkReferences to return the mockDomainError for the first call (for rolle1)
            jest.spyOn(anlage, 'checkReferences')
                .mockResolvedValueOnce(mockDomainError) // For rolle1
                .mockResolvedValueOnce(undefined); // For rolle2
            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions);

            // Only rolle2 should be included because rolle1 fails the reference check
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(rolle2);
        });

        it('should always include roles passed via rollenIds even if over the limit', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.LAND,
            });
            const childOrganisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.KLASSE,
            });

            const rolle1: Rolle<true> = DoFactory.createRolle(true, { id: 'id-1', name: 'rolle1' });
            const rolle2: Rolle<true> = DoFactory.createRolle(true, { id: 'id-2', name: 'rolle2' });
            const rolle3: Rolle<true> = DoFactory.createRolle(true, { id: 'id-3', name: 'rolle3' }); // passed via rollenIds

            const rollen: Rolle<true>[] = [rolle1, rolle2]; // only rolle1 and rolle2 returned via .find

            organisationRepoMock.findById.mockResolvedValue(organisation);
            organisationRepoMock.findChildOrgasForIds.mockResolvedValue([childOrganisation]);
            organisationRepoMock.findByIds.mockResolvedValue(
                new Map([organisation, childOrganisation].map((org: Organisation<true>) => [org.id, org])),
            );

            const rolleMap: Map<string, Rolle<true>> = new Map([
                [rolle3.id, rolle3],
                [rolle3.id, rolle3],
            ]);
            rolleRepoMock.find.mockResolvedValue(rollen);
            rolleRepoMock.findByIds.mockResolvedValue(rolleMap); // simulate lookup of passed rollenIds

            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechteAtOrganisation.mockResolvedValue(true);

            jest.spyOn(anlage, 'checkReferences').mockResolvedValue(undefined);

            anlage.initialize(undefined, organisation.id);

            const result: Rolle<true>[] = await anlage.findRollenForOrganisation(permissions, undefined, ['id-3'], 2);

            // Check that rolle3 is included even if it's outside the limit
            expect(result.map((r: Rolle<true>) => r.id)).toEqual(expect.arrayContaining(['id-1', 'id-3']));
            expect(result.length).toBe(2);
        });
    });
    describe('commit', () => {
        it('should successfully commit personenkontexte', async () => {
            const personId: string = faker.string.uuid();
            const lastModified: Date = faker.date.recent();
            const count: number = 1;
            const personenkontexte: DbiamPersonenkontextBodyParams[] = [];

            const personenkontext: Personenkontext<true> = createMock<Personenkontext<true>>();
            const updateResult: Personenkontext<true>[] = [personenkontext];

            dbiamPersonenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValue({
                update: jest.fn().mockResolvedValue(updateResult),
            } as never);

            const result: Personenkontext<true>[] | PersonenkontexteUpdateError = await anlage.commit(
                personId,
                lastModified,
                count,
                personenkontexte,
                personpermissionsMock,
            );

            expect(result).toEqual(updateResult);
        });

        it('should return an error if PersonenkontexteUpdateError is returned', async () => {
            const personId: string = faker.string.uuid();
            const lastModified: Date = faker.date.recent();
            const count: number = 1;
            const personenkontexte: DbiamPersonenkontextBodyParams[] = [];

            const updateError: PersonenkontexteUpdateError = new PersonenkontexteUpdateError('Error message');
            dbiamPersonenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValue({
                update: jest.fn().mockResolvedValue(updateError),
            } as never);

            const result: PersonenkontexteUpdateError | Personenkontext<true>[] = await anlage.commit(
                personId,
                lastModified,
                count,
                personenkontexte,
                personpermissionsMock,
            );

            expect(result).toBeInstanceOf(PersonenkontexteUpdateError);
        });
    });

    describe('checkPermissions', () => {
        it('should return undefined if user has limited anlegen permissions and only limited rollen are assigned', async () => {
            configMock.getOrThrow.mockReturnValueOnce({
                LIMITED_ROLLENART_ALLOWLIST: [RollenArt.LERN],
            });
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const lehrRolle: Rolle<true> = DoFactory.createRolle(true, {
                id: faker.string.uuid(),
                name: 'Test Rolle',
                rollenart: RollenArt.LERN,
            });
            const rolleMap: Map<string, Rolle<true>> = new Map([[lehrRolle.id, lehrRolle]]);
            rolleRepoMock.findByIds.mockResolvedValue(rolleMap);

            const result: Option<DomainError> = await anlage.checkPermissions(
                permissions,
                undefined,
                'orgId',
                [lehrRolle.id],
                OperationContext.PERSON_ANLEGEN,
            );

            expect(result).toBe(undefined);
        });

        it('should return undefined if context is PERSON_BEARBEITEN and user has systemrecht PERSONEN_VERWALTEN', async () => {
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const result: Option<DomainError> = await anlage.checkPermissions(
                permissions,
                undefined,
                'orgId',
                [],
                OperationContext.PERSON_BEARBEITEN,
            );

            expect(result).toBe(undefined);
        });

        describe.each([[OperationContext.PERSON_ANLEGEN], [OperationContext.PERSON_BEARBEITEN]])(
            'when context is %s',
            (operationContext: OperationContext) => {
                it('should return error if user does not have the correct rights', async () => {
                    const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                    if (operationContext === OperationContext.PERSON_ANLEGEN) {
                        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
                        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
                    } else if (operationContext === OperationContext.PERSON_BEARBEITEN) {
                        permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
                    }

                    const lehrRolle: Rolle<true> = DoFactory.createRolle(true, {
                        id: faker.string.uuid(),
                        name: 'Test Rolle',
                        rollenart: RollenArt.LERN,
                    });
                    const leitRolle: Rolle<true> = DoFactory.createRolle(true, {
                        id: faker.string.uuid(),
                        name: 'Test Rolle',
                        rollenart: RollenArt.LEIT,
                    });
                    const rolleMap: Map<string, Rolle<true>> = new Map([
                        [lehrRolle.id, lehrRolle],
                        [leitRolle.id, leitRolle],
                    ]);
                    rolleRepoMock.findByIds.mockResolvedValue(rolleMap);

                    const result: Option<DomainError> = await anlage.checkPermissions(
                        permissions,
                        undefined,
                        'orgId',
                        [lehrRolle.id, leitRolle.id],
                        operationContext,
                    );

                    expect(result).toBeInstanceOf(DomainError);
                });

                it('should return error if config is not set for limited rollenarten', async () => {
                    configMock.getOrThrow.mockReturnValueOnce({ LIMITED_ROLLENART_ALLOWLIST: undefined });

                    const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                    permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
                    permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                    const lehrRolle: Rolle<true> = DoFactory.createRolle(true, {
                        id: faker.string.uuid(),
                        name: 'Test Rolle',
                        rollenart: RollenArt.LERN,
                    });
                    const rolleMap: Map<string, Rolle<true>> = new Map([[lehrRolle.id, lehrRolle]]);
                    rolleRepoMock.findByIds.mockResolvedValue(rolleMap);

                    const result: Option<DomainError> = await anlage.checkPermissions(
                        permissions,
                        undefined,
                        'orgId',
                        [lehrRolle.id],
                        operationContext,
                    );

                    expect(result).toBeInstanceOf(DomainError);
                });

                it('should return error if personid is set but user is not allowed to modify', async () => {
                    const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                    permissions.canModifyPerson.mockResolvedValueOnce(false);

                    const result: Option<DomainError> = await anlage.checkPermissions(
                        permissions,
                        'personId',
                        'orgId',
                        ['rolleId'],
                        operationContext,
                    );

                    expect(result).toBeInstanceOf(DomainError);
                });
            },
        );
    });

    it('should return an empty array if no personenkontexte are passed', async () => {
        const personId: string = faker.string.uuid();
        const lastModified: Date = faker.date.recent();
        const count: number = 0;
        const personenkontexte: DbiamPersonenkontextBodyParams[] = [];

        dbiamPersonenkontextFactoryMock.createNewPersonenkontexteUpdate.mockReturnValue({
            update: jest.fn().mockResolvedValue([]),
        } as never);

        const result: Personenkontext<true>[] | PersonenkontexteUpdateError = await anlage.commit(
            personId,
            lastModified,
            count,
            personenkontexte,
            personpermissionsMock,
        );

        expect(result).toEqual([]);
    });
});
