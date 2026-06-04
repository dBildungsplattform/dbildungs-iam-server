import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { EscalatedPersonPermissionsFactory } from '../../permission/escalated-person-permissions.factory.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import {
	ServiceProviderKategorie,
	ServiceProviderMerkmal,
	ServiceProviderSystem,
	ServiceProviderTarget,
} from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { VidisApiService } from './vidis.api-service.js';
import { VidisSyncService } from './vidis.sync-service.js';
import type { VidisAngebotWithSchoolActivations, VidisServiceResponseAngebot } from './vidis.types.js';
import { EscalatedPersonPermissions } from '../../permission/escalated-person-permissions.js';
import { faker } from '@faker-js/faker';

type TorgaIds = {
    id: string;
    kennung: string;
}

describe('VidisSyncService', () => {
	let module: TestingModule;
	let sut: VidisSyncService;
	let vidisApiServiceMock: DeepMocked<VidisApiService>;
	let organisationRepoMock: DeepMocked<OrganisationRepository>;
	let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
	let escalatedPersonPermissionsFactoryMock: DeepMocked<EscalatedPersonPermissionsFactory>;
	let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
	let loggerMock: DeepMocked<ClassLogger>;
	let getOrThrowMock: ReturnType<typeof vi.fn>;
	let permissionsMock: EscalatedPersonPermissions;

	type GetActivatedAngeboteByRegionResult = Awaited<ReturnType<VidisApiService['getActivatedAngeboteByRegionSH']>>;
	type FindSchoolsResult = Awaited<ReturnType<OrganisationRepository['findBy']>>;
	type FindVidisAngeboteForSchoolsResult = Awaited<ReturnType<ServiceProviderRepo['findVidisAngeboteforSchools']>>;
	type CreateServiceProviderResult = Awaited<ReturnType<ServiceProviderRepo['create']>>;
	type VidisSchoolActivatedAngebot = { angebot: VidisServiceResponseAngebot; date: string };

	const tinyPngBase64: string = 'iVBORw0KGgo=';
	const vidisApiServiceProviderMock: Pick<VidisApiService, 'getActivatedAngeboteByRegionSH'> = {
		getActivatedAngeboteByRegionSH: vi.fn(),
	};

	const createAngebot = (offerId: number, offerTitle: string): VidisServiceResponseAngebot => ({
		clientId: `["angebot-${offerId}"]`,
		educationProviderOrganizationName: `Provider ${offerId}`,
		offerDescription: `Beschreibung ${offerId}`,
		offerId: offerId,
		offerLink: `https://example.org/${offerId}`,
		offerLogo: tinyPngBase64,
		offerLongTitle: `Angebot ${offerId}`,
		offerTitle: offerTitle,
		offerVersion: 1,
	});

	const activatedAngebote: VidisAngebotWithSchoolActivations[] = [
		{
			angebot: createAngebot(1, 'A'),
			schoolActivations: [
				{
					date: '2026-04-22',
					kennung: '09099997',
				},
				{
					date: '2026-04-16',
					kennung: '123456',
				},
			],
		},
		{
			angebot: createAngebot(2, 'B'),
			schoolActivations: [
				{
					date: '2026-04-16',
					kennung: '123456',
				},
			],
		},
	];

	const createSchool = (organisationId: string, kennung: string): Organisation<true> =>
		Organisation.construct(
			organisationId,
			new Date('2026-01-01'),
			new Date('2026-01-02'),
			1,
			undefined,
			undefined,
			kennung,
		);

	const createExistingVidisServiceProvider = (
		organisationId: string,
		vidisAngebotId: string,
	): ServiceProvider<true> =>
		ServiceProvider.construct<true>(
			`service-provider-${organisationId}-${vidisAngebotId}`,
			new Date('2026-01-01'),
			new Date('2026-01-02'),
			`Angebot ${vidisAngebotId}`,
			ServiceProviderTarget.URL,
			`https://example.org/${vidisAngebotId}`,
			ServiceProviderKategorie.SCHULISCH,
			organisationId,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			ServiceProviderSystem.NONE,
			false,
			vidisAngebotId,
			[],
		);

	beforeAll(async () => {
		getOrThrowMock = vi.fn().mockReturnValue({
			SYNC_SCHOOLS_PAGE_SIZE: 100,
		});

		module = await Test.createTestingModule({
			providers: [
				{
					provide: VidisApiService,
					useValue: vidisApiServiceProviderMock,
				},
				{
					provide: OrganisationRepository,
					useValue: createMock(OrganisationRepository),
				},
				{
					provide: ServiceProviderRepo,
					useValue: createMock(ServiceProviderRepo),
				},
				{
					provide: EscalatedPersonPermissionsFactory,
					useValue: createMock(EscalatedPersonPermissionsFactory),
				},
				{
					provide: RollenerweiterungRepo,
					useValue: createMock(RollenerweiterungRepo),
				},
				{
					provide: ClassLogger,
					useValue: createMock(ClassLogger),
				},
				{
					provide: ConfigService,
					useValue: { getOrThrow: getOrThrowMock },
				},
			],
		}).compile();

		vidisApiServiceMock = module.get(VidisApiService);
		organisationRepoMock = module.get(OrganisationRepository);
		serviceProviderRepoMock = module.get(ServiceProviderRepo);
		escalatedPersonPermissionsFactoryMock = module.get(EscalatedPersonPermissionsFactory);
		rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
		loggerMock = module.get(ClassLogger);
		sut = new VidisSyncService(
			vidisApiServiceMock,
			organisationRepoMock,
			serviceProviderRepoMock,
			escalatedPersonPermissionsFactoryMock,
			rollenerweiterungRepoMock,
			loggerMock,
			module.get(ConfigService),
		);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();

		permissionsMock = createPersonPermissionsMock() as unknown as EscalatedPersonPermissions;
		getOrThrowMock.mockReturnValue({
			SYNC_SCHOOLS_PAGE_SIZE: 100,
		});
		escalatedPersonPermissionsFactoryMock.createNew.mockReturnValue(permissionsMock);
	});

	it('should group activated Angebote by organisationId and pass existing service providers per school', async () => {

		const orga1: TorgaIds = {
			id: faker.string.uuid(),
			kennung: '123456',
		};
		const orga2: TorgaIds = {
			id: faker.string.uuid(),
			kennung: '09099997',
		};

		const getActivatedAngeboteResult: GetActivatedAngeboteByRegionResult = Ok(activatedAngebote);
		const schools: FindSchoolsResult = [
			[
				createSchool(orga1.id, orga1.kennung),
				createSchool(orga2.id, orga2.kennung),
			],
			2,
		];
		const existingVidisAngeboteForSchools: FindVidisAngeboteForSchoolsResult = [
			createExistingVidisServiceProvider(orga1.id, '1'),
			createExistingVidisServiceProvider(orga2.id, '1'),
		];

		vidisApiServiceMock.getActivatedAngeboteByRegionSH.mockResolvedValue(getActivatedAngeboteResult);
		organisationRepoMock.findBy.mockResolvedValue(schools);
		serviceProviderRepoMock.findVidisAngeboteforSchools.mockResolvedValue(existingVidisAngeboteForSchools);
		const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
			.spyOn(
				sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
				'syncForSchoolInternal',
			)
			.mockResolvedValue();

		await sut.sync();

		expect(serviceProviderRepoMock.findVidisAngeboteforSchools).toHaveBeenCalledWith([
			orga1.id,
			orga2.id,
		]);
		expect(syncForSchoolSpy).toHaveBeenCalledTimes(2);
		expect(syncForSchoolSpy).toHaveBeenCalledWith(orga1.id, [
			{
				angebot: activatedAngebote[0]?.angebot,
				date: '2026-04-16',
			},
			{
				angebot: activatedAngebote[1]?.angebot,
				date: '2026-04-16',
			},
		], [existingVidisAngeboteForSchools[0]], permissionsMock);
		expect(syncForSchoolSpy).toHaveBeenCalledWith(orga2.id, [
			{
				angebot: activatedAngebote[0]?.angebot,
				date: '2026-04-22',
			},
		], [existingVidisAngeboteForSchools[1]], permissionsMock);
	});

	it('should sync schools page by page with a page size of 100', async () => {
		const orgaIds: TorgaIds[] = Array.from({ length: 101 }, (_value: unknown, index: number) => ({
			id: `organisation-${index}`,
			kennung: `${200000 + index}`,
		}));
		const pagedActivatedAngebote: VidisAngebotWithSchoolActivations[] = [
			{
				angebot: activatedAngebote[0]!.angebot,
				schoolActivations: Array.from({ length: 101 }, (_value: unknown, index: number) => ({
					date: '2026-05-01',
					kennung: orgaIds[index]!.kennung,
				})),
			},
		];
		const firstPageSchools: Organisation<true>[] = Array.from(
			{ length: 100 },
			(_value: unknown, index: number) => createSchool(orgaIds[index]!.id, orgaIds[index]!.kennung),
		);
		const secondPageSchools: Organisation<true>[] = [createSchool(orgaIds[100]!.id, orgaIds[100]!.kennung)];

		vidisApiServiceMock.getActivatedAngeboteByRegionSH.mockResolvedValue(Ok(pagedActivatedAngebote));
		organisationRepoMock.findBy
			.mockResolvedValueOnce([firstPageSchools, 101])
			.mockResolvedValueOnce([secondPageSchools, 101]);
		serviceProviderRepoMock.findVidisAngeboteforSchools
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([]);
		const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
			.spyOn(
				sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
				'syncForSchoolInternal',
			)
			.mockResolvedValue();

		await sut.sync();

		expect(organisationRepoMock.findBy).toHaveBeenCalledTimes(2);
		expect(serviceProviderRepoMock.findVidisAngeboteforSchools).toHaveBeenCalledTimes(2);
		expect(syncForSchoolSpy).toHaveBeenCalledTimes(101);
	});

	it('should create missing VIDIS Angebote for the school and skip existing ones', async () => {
		const orga: TorgaIds = {
			id: faker.string.uuid(),
			kennung: faker.string.alphanumeric(8),
		};
		const angeboteInVidis: VidisSchoolActivatedAngebot[] = [
			{
				angebot: createAngebot(1, 'Existing Angebot'),
				date: '2026-05-02',
			},
			{
				angebot: createAngebot(2, 'Missing Angebot'),
				date: '2026-05-03',
			},
		];
		const angeboteInDb: ServiceProvider<true>[] = [createExistingVidisServiceProvider(orga.id, '1')];
		serviceProviderRepoMock.create.mockResolvedValue(Ok(createExistingVidisServiceProvider(orga.id, '2')));

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: VidisSchoolActivatedAngebot[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(orga.id, angeboteInVidis, angeboteInDb, permissionsMock);

		expect(serviceProviderRepoMock.create).toHaveBeenCalledTimes(1);
		expect(serviceProviderRepoMock.create).toHaveBeenCalledWith(permissionsMock, expect.any(ServiceProvider));
		const createdServiceProvider: ServiceProvider<false> = serviceProviderRepoMock.create.mock.calls[0]?.[1] as ServiceProvider<false>;

		expect(createdServiceProvider.name).toBe('Missing Angebot');
		expect(createdServiceProvider.target).toBe(ServiceProviderTarget.URL);
		expect(createdServiceProvider.url).toBe('https://example.org/2');
		expect(createdServiceProvider.kategorie).toBe(ServiceProviderKategorie.SCHULISCH);
		expect(createdServiceProvider.providedOnSchulstrukturknoten).toBe(orga.id);
		expect(createdServiceProvider.logoId).toBeUndefined();
		expect(createdServiceProvider.logo).toEqual(Buffer.from(tinyPngBase64, 'base64'));
		expect(createdServiceProvider.logoMimeType).toBe('image/png');
		expect(createdServiceProvider.keycloakGroup).toBeUndefined();
		expect(createdServiceProvider.keycloakRole).toBeUndefined();
		expect(createdServiceProvider.externalSystem).toBe(ServiceProviderSystem.NONE);
		expect(createdServiceProvider.requires2fa).toBe(false);
		expect(createdServiceProvider.vidisAngebotId).toBe('2');
		expect(createdServiceProvider.merkmale).toEqual([
			ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
			ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
		]);
	});

	it('should collect stale serviceProviderIds for Angebote that are no longer in VIDIS', async () => {
		const orga: TorgaIds = {
			id: faker.string.uuid(),
			kennung: faker.string.alphanumeric(8),
		};
		const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(orga.id, '2');
		const angeboteInVidis: VidisSchoolActivatedAngebot[] = [
			{
				angebot: createAngebot(1, 'Existing Angebot'),
				date: '2026-05-02',
			},
		];
		const angeboteInDb: ServiceProvider<true>[] = [
			createExistingVidisServiceProvider(orga.id, '1'),
			staleServiceProvider,
		];
		rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockResolvedValue(Ok(null));

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: VidisSchoolActivatedAngebot[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(orga.id, angeboteInVidis, angeboteInDb, permissionsMock);

		expect(rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds).toHaveBeenCalledWith(
			orga.id,
			[staleServiceProvider.id],
			permissionsMock,
		);
		expect(serviceProviderRepoMock.create).not.toHaveBeenCalled();
	});

	it('should log rejected sync operations for a school', async () => {
		const orga: TorgaIds = {
			id: faker.string.uuid(),
			kennung: faker.string.alphanumeric(8),
		};
		const rejectionReason: Error = new Error('VIDIS create rejected');
		const angeboteInVidis: VidisSchoolActivatedAngebot[] = [
			{
				angebot: createAngebot(1, 'Rejected Angebot'),
				date: '2026-05-02',
			},
		];
		serviceProviderRepoMock.create.mockRejectedValue(rejectionReason);

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: VidisSchoolActivatedAngebot[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(orga.id, angeboteInVidis, [], permissionsMock);

		expect(loggerMock.error).toHaveBeenCalledWith(
			`VIDIS sync for organisation ${orga.id} finished with 1 failed operations.`,
		);
		expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
			`VIDIS sync operation for organisation ${orga.id} rejected`,
			rejectionReason,
		);
	});

	it('should log failed sync results for a school', async () => {
		const orga: TorgaIds = {
			id: faker.string.uuid(),
			kennung: faker.string.alphanumeric(8),
		};
		const resultError: Error = new Error('VIDIS create failed');
		const failedResultWithoutError: { ok: false } = { ok: false };
		const angeboteInVidis: VidisSchoolActivatedAngebot[] = [
			{
				angebot: createAngebot(1, 'Error Angebot'),
				date: '2026-05-02',
			},
			{
				angebot: createAngebot(2, 'Missing Error Payload Angebot'),
				date: '2026-05-03',
			},
		];
		serviceProviderRepoMock.create
			.mockResolvedValueOnce(Err(resultError) as CreateServiceProviderResult)
			.mockResolvedValueOnce(failedResultWithoutError as unknown as CreateServiceProviderResult);

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: VidisSchoolActivatedAngebot[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(orga.id, angeboteInVidis, [], permissionsMock);

		expect(loggerMock.error).toHaveBeenCalledWith(
			`VIDIS sync for organisation ${orga.id} finished with 2 failed operations.`,
		);
		expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
			`VIDIS sync operation for organisation ${orga.id} returned an error result`,
			resultError,
			false,
		);
		expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
			`VIDIS sync operation for organisation ${orga.id} returned an error result`,
			failedResultWithoutError,
			false,
		);
	});
});