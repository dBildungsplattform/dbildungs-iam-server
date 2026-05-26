import { vi } from 'vitest';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { Ok } from '../../../shared/util/result.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import type { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { VidisApiService } from './vidis.api-service.js';
import { VidisSyncService } from './vidis.sync-service.js';
import type { VidisAngebotWithSchoolActivations } from './vidis.types.js';

describe('VidisSyncService', () => {
	let sut: VidisSyncService;
	let vidisApiServiceMock: DeepMocked<VidisApiService>;
	let organisationRepoMock: DeepMocked<OrganisationRepository>;
	let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
	let loggerMock: DeepMocked<ClassLogger>;

	type GetActivatedAngeboteByRegionResult = Awaited<ReturnType<VidisApiService['getActivatedAngeboteByRegionSH']>>;
	type FindSchoolsResult = Awaited<ReturnType<OrganisationRepository['findBy']>>;
	type FindExistingVidisAngeboteResult = Awaited<
		ReturnType<RollenerweiterungRepo['findManyByOrganisationIdsAndVidisAngebotIds']>
	>;

	const activatedAngebote: VidisAngebotWithSchoolActivations[] = [
		{
			angebot: {
				clientId: '["angebot-a"]',
				educationProviderOrganizationName: 'Provider A',
				offerDescription: 'Beschreibung A',
				offerId: 1,
				offerLink: 'https://example.org/a',
				offerLogo: 'logo-a',
				offerLongTitle: 'Angebot A',
				offerTitle: 'A',
				offerVersion: 1,
			},
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
			angebot: {
				clientId: '["angebot-b"]',
				educationProviderOrganizationName: 'Provider B',
				offerDescription: 'Beschreibung B',
				offerId: 2,
				offerLink: 'https://example.org/b',
				offerLogo: 'logo-b',
				offerLongTitle: 'Angebot B',
				offerTitle: 'B',
				offerVersion: 1,
			},
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

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();

		vidisApiServiceMock = createMock(VidisApiService);
		organisationRepoMock = createMock(OrganisationRepository);
		rollenerweiterungRepoMock = createMock(RollenerweiterungRepo);
		loggerMock = createMock(ClassLogger);

		sut = new VidisSyncService(
			vidisApiServiceMock,
			organisationRepoMock,
			rollenerweiterungRepoMock,
			loggerMock,
		);
	});

	it('should group activated Angebote by organisationId and pass existing rollenerweiterungen per school', async () => {
		const getActivatedAngeboteResult: GetActivatedAngeboteByRegionResult = Ok(activatedAngebote);
		const schools: FindSchoolsResult = [
			[
				createSchool('organisation-1', '123456'),
				createSchool('organisation-2', '09099997'),
			],
			2,
		];
		const existingRollenerweiterungForOrganisation1: Rollenerweiterung<true> = {} as Rollenerweiterung<true>;
		const existingRollenerweiterungForOrganisation2: Rollenerweiterung<true> = {} as Rollenerweiterung<true>;
		const existingVidisAngeboteForSchools: FindExistingVidisAngeboteResult = new Map([
			['organisation-1', [existingRollenerweiterungForOrganisation1]],
			['organisation-2', [existingRollenerweiterungForOrganisation2]],
		]);

		vidisApiServiceMock.getActivatedAngeboteByRegionSH.mockResolvedValue(getActivatedAngeboteResult);
		organisationRepoMock.findBy.mockResolvedValue(schools);
		rollenerweiterungRepoMock.findManyByOrganisationIdsAndVidisAngebotIds.mockResolvedValue(
			existingVidisAngeboteForSchools,
		);
		const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
			.spyOn(
				sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
				'syncForSchoolInternal',
			)
			.mockResolvedValue();

		await sut.sync();

		expect(rollenerweiterungRepoMock.findManyByOrganisationIdsAndVidisAngebotIds).toHaveBeenCalledWith(
			['organisation-1', 'organisation-2'],
			['1', '2'],
		);
		expect(syncForSchoolSpy).toHaveBeenCalledTimes(2);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-1', [
			{
				angebot: activatedAngebote[0].angebot,
				date: '2026-04-16',
			},
			{
				angebot: activatedAngebote[1].angebot,
				date: '2026-04-16',
			},
		], [existingRollenerweiterungForOrganisation1]);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-2', [
			{
				angebot: activatedAngebote[0].angebot,
				date: '2026-04-22',
			},
		], [existingRollenerweiterungForOrganisation2]);
	});

	it('should sync schools page by page with a page size of 100', async () => {
		const pagedActivatedAngebote: VidisAngebotWithSchoolActivations[] = [
			{
				angebot: activatedAngebote[0].angebot,
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
		rollenerweiterungRepoMock.findManyByOrganisationIdsAndVidisAngebotIds
			.mockResolvedValueOnce(new Map(firstPageSchools.map((school: Organisation<true>) => [school.id, []])))
			.mockResolvedValueOnce(new Map(secondPageSchools.map((school: Organisation<true>) => [school.id, []])));
		const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
			.spyOn(
				sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
				'syncForSchoolInternal',
			)
			.mockResolvedValue();

		await sut.sync();

		expect(organisationRepoMock.findBy).toHaveBeenCalledTimes(2);
		expect(rollenerweiterungRepoMock.findManyByOrganisationIdsAndVidisAngebotIds).toHaveBeenCalledTimes(2);
		const firstScope: { offset?: number; limit?: number } = organisationRepoMock.findBy.mock.calls[0]?.[0] as {
			offset?: number;
			limit?: number;
		};
		const secondScope: { offset?: number; limit?: number } = organisationRepoMock.findBy.mock.calls[1]?.[0] as {
			offset?: number;
			limit?: number;
		};

		expect(firstScope.offset).toBe(0);
		expect(firstScope.limit).toBe(100);
		expect(secondScope.offset).toBe(100);
		expect(secondScope.limit).toBe(100);
		expect(syncForSchoolSpy).toHaveBeenCalledTimes(101);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-0', [
			{
				angebot: pagedActivatedAngebote[0].angebot,
				date: '2026-05-01',
			},
		], []);
		expect(syncForSchoolSpy).toHaveBeenCalledWith('organisation-100', [
			{
				angebot: pagedActivatedAngebote[0].angebot,
				date: '2026-05-01',
			},
		], []);
	});
});