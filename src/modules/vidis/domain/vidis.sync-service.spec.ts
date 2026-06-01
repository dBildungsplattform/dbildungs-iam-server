import { vi } from 'vitest';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { Ok } from '../../../shared/util/result.js';
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

describe('VidisSyncService', () => {
	let sut: VidisSyncService;
	let vidisApiServiceMock: DeepMocked<VidisApiService>;
	let organisationRepoMock: DeepMocked<OrganisationRepository>;
	let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
	let escalatedPersonPermissionsFactoryMock: DeepMocked<EscalatedPersonPermissionsFactory>;
	let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
	let loggerMock: DeepMocked<ClassLogger>;
	let permissionsMock: EscalatedPersonPermissions;

	type GetActivatedAngeboteByRegionResult = Awaited<ReturnType<VidisApiService['getActivatedAngeboteByRegionSH']>>;
	type FindSchoolsResult = Awaited<ReturnType<OrganisationRepository['findBy']>>;
	type FindVidisAngeboteForSchoolsResult = Awaited<ReturnType<ServiceProviderRepo['findVidisAngeboteforSchools']>>;

	const tinyPngBase64: string = 'iVBORw0KGgo=';

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

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();

		vidisApiServiceMock = createMock(VidisApiService);
		organisationRepoMock = createMock(OrganisationRepository);
		serviceProviderRepoMock = createMock(ServiceProviderRepo);
		escalatedPersonPermissionsFactoryMock = createMock(EscalatedPersonPermissionsFactory);
		rollenerweiterungRepoMock = createMock(RollenerweiterungRepo);
		loggerMock = createMock(ClassLogger);
		permissionsMock = createPersonPermissionsMock() as unknown as EscalatedPersonPermissions;

		escalatedPersonPermissionsFactoryMock.createNew.mockReturnValue(permissionsMock);

		sut = new VidisSyncService(
			vidisApiServiceMock,
			organisationRepoMock,
			serviceProviderRepoMock,
			escalatedPersonPermissionsFactoryMock,
			rollenerweiterungRepoMock,
			loggerMock,
		);
	});

	it('should group activated Angebote by organisationId and pass existing service providers per school', async () => {
		const getActivatedAngeboteResult: GetActivatedAngeboteByRegionResult = Ok(activatedAngebote);
		const schools: FindSchoolsResult = [
			[
				createSchool('organisation-1', '123456'),
				createSchool('organisation-2', '09099997'),
			],
			2,
		];
		const existingVidisAngeboteForSchools: FindVidisAngeboteForSchoolsResult = [
			createExistingVidisServiceProvider('organisation-1', '1'),
			createExistingVidisServiceProvider('organisation-2', '1'),
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
			'organisation-1',
			'organisation-2',
		]);
		expect(syncForSchoolSpy).toHaveBeenCalledTimes(2);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-1', [
			{
				angebot: activatedAngebote[0]?.angebot,
				date: '2026-04-16',
			},
			{
				angebot: activatedAngebote[1]?.angebot,
				date: '2026-04-16',
			},
		], [existingVidisAngeboteForSchools[0]], permissionsMock);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-2', [
			{
				angebot: activatedAngebote[0]?.angebot,
				date: '2026-04-22',
			},
		], [existingVidisAngeboteForSchools[1]], permissionsMock);
	});

	it('should sync schools page by page with a page size of 100', async () => {
		const pagedActivatedAngebote: VidisAngebotWithSchoolActivations[] = [
			{
				angebot: activatedAngebote[0]!.angebot,
				schoolActivations: Array.from({ length: 101 }, (_value: unknown, index: number) => ({
					date: '2026-05-01',
					kennung: `${200000 + index}`,
				})),
			},
		];
		const firstPageSchools: Organisation<true>[] = Array.from(
			{ length: 100 },
			(_value: unknown, index: number) => createSchool(`organisation-${index}`, `${200000 + index}`),
		);
		const secondPageSchools: Organisation<true>[] = [createSchool('organisation-100', '200100')];

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
		const organisationId: string = 'organisation-1';
		const angeboteInVidis = [
			{
				angebot: createAngebot(1, 'Existing Angebot'),
				date: '2026-05-02',
			},
			{
				angebot: createAngebot(2, 'Missing Angebot'),
				date: '2026-05-03',
			},
		];
		const angeboteInDb: ServiceProvider<true>[] = [createExistingVidisServiceProvider(organisationId, '1')];
		serviceProviderRepoMock.create.mockResolvedValue(Ok(createExistingVidisServiceProvider(organisationId, '2')));

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: { angebot: VidisServiceResponseAngebot; date: string }[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(organisationId, angeboteInVidis, angeboteInDb, permissionsMock);

		expect(serviceProviderRepoMock.create).toHaveBeenCalledTimes(1);
		expect(serviceProviderRepoMock.create).toHaveBeenCalledWith(permissionsMock, expect.any(ServiceProvider));
		const createdServiceProvider: ServiceProvider<false> = serviceProviderRepoMock.create.mock.calls[0]?.[1] as ServiceProvider<false>;

		expect(createdServiceProvider.name).toBe('Missing Angebot');
		expect(createdServiceProvider.target).toBe(ServiceProviderTarget.URL);
		expect(createdServiceProvider.url).toBe('https://example.org/2');
		expect(createdServiceProvider.kategorie).toBe(ServiceProviderKategorie.SCHULISCH);
		expect(createdServiceProvider.providedOnSchulstrukturknoten).toBe(organisationId);
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
		const organisationId: string = 'organisation-1';
		const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(organisationId, '2');
		const angeboteInVidis = [
			{
				angebot: createAngebot(1, 'Existing Angebot'),
				date: '2026-05-02',
			},
		];
		const angeboteInDb: ServiceProvider<true>[] = [
			createExistingVidisServiceProvider(organisationId, '1'),
			staleServiceProvider,
		];
		rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockResolvedValue(Ok(null));

		await (
			sut as unknown as {
				syncForSchoolInternal: (
					organisationId: string,
					angeboteInVidis: { angebot: VidisServiceResponseAngebot; date: string }[],
					angeboteInDb: ServiceProvider<true>[],
					permissions: IPersonPermissions,
				) => Promise<void>;
			}
		).syncForSchoolInternal(organisationId, angeboteInVidis, angeboteInDb, permissionsMock);

		expect(rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds).toHaveBeenCalledWith(
			organisationId,
			[staleServiceProvider.id],
			permissionsMock,
		);
		expect(serviceProviderRepoMock.create).not.toHaveBeenCalled();
	});
});