import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import { createMock, DeepMocked } from '../../../../../test/utils/createMock.js';
import { createPersonPermissionsMock } from '../../../../../test/utils/auth.mock.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { Err, Ok } from '../../../../shared/util/result.js';
import { IPersonPermissions } from '../../../../shared/permissions/person-permissions.interface.js';
import { Organisation } from '../../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../../organisation/persistence/organisation.repository.js';
import { EscalatedPersonPermissionsFactory } from '../../../permission/escalated-person-permissions.factory.js';
import { RollenerweiterungRepo } from '../../../rolle/repo/rollenerweiterung.repo.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from '../../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../../service-provider/repo/service-provider.repo.js';
import type { VidisAngebotWithSchoolActivations, VidisServiceResponseAngebot } from './vidis.types.js';
import { EscalatedPersonPermissions } from '../../../permission/escalated-person-permissions.js';
import { faker } from '@faker-js/faker';
import { VidisSyncService } from './vidis.sync-service.js';
import { VidisApiAdapter } from './vidis-api.adapter.js';
import { VidisDomainError } from './vidis-domain.error.js';

type TorgaIds = {
    id: string;
    kennung: string;
};

describe('VidisSyncService', () => {
    let module: TestingModule;
    let sut: VidisSyncService;
    let vidisApiAdapterMock: DeepMocked<VidisApiAdapter>;
    let organisationRepoMock: DeepMocked<OrganisationRepository>;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let escalatedPersonPermissionsFactoryMock: DeepMocked<EscalatedPersonPermissionsFactory>;
    let rollenerweiterungRepoMock: DeepMocked<RollenerweiterungRepo>;
    let loggerMock: DeepMocked<ClassLogger>;
    let getOrThrowMock: ReturnType<typeof vi.fn>;
    let permissionsMock: EscalatedPersonPermissions;

    type GetActivatedAngeboteByRegionResult = Awaited<ReturnType<VidisApiAdapter['getActivatedAngeboteByRegionSH']>>;
    type FindSchoolsResult = Awaited<ReturnType<OrganisationRepository['findBy']>>;
    type FindVidisAngeboteForSchoolsResult = Awaited<ReturnType<ServiceProviderRepo['findVidisAngeboteforSchools']>>;
    type CreateServiceProviderResult = Awaited<ReturnType<ServiceProviderRepo['create']>>;
    type DeleteRollenerweiterungenResult = Awaited<
        ReturnType<RollenerweiterungRepo['deleteByOrganisationIdAndServiceProviderIds']>
    >;
    type VidisSchoolActivatedAngebot = { angebot: VidisServiceResponseAngebot; date: string };
    type DecodedVidisLogoResult = { logo: Buffer | undefined; logoMimeType: string | undefined };

    const tinyPngBase64: string = 'iVBORw0KGgo=';
    const vidisApiServiceProviderMock: Pick<VidisApiAdapter, 'getActivatedAngeboteByRegionSH'> = {
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

    const decodeVidisLogo = (offerLogo: string): DecodedVidisLogoResult =>
        (
            VidisSyncService as unknown as { decodeVidisLogo: (offerLogo: string) => DecodedVidisLogoResult }
        ).decodeVidisLogo(offerLogo);

    const detectLogoMimeType = (logo: Buffer): string | undefined =>
        (
            VidisSyncService as unknown as { detectLogoMimeType: (logo: Buffer) => string | undefined }
        ).detectLogoMimeType(logo);

    const mapOrganisationIdsByKennung = (schools: Organisation<true>[]): Record<string, string> =>
        (
            sut as unknown as {
                mapOrganisationIdsByKennung: (schools: Organisation<true>[]) => Record<string, string>;
            }
        ).mapOrganisationIdsByKennung(schools);

    beforeAll(async () => {
        getOrThrowMock = vi.fn().mockReturnValue({
            SYNC_SCHOOLS_PAGE_SIZE: 100,
        });
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: VidisApiAdapter,
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

        vidisApiAdapterMock = module.get(VidisApiAdapter);
        organisationRepoMock = module.get(OrganisationRepository);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        escalatedPersonPermissionsFactoryMock = module.get(EscalatedPersonPermissionsFactory);
        rollenerweiterungRepoMock = module.get(RollenerweiterungRepo);
        loggerMock = module.get(ClassLogger);
        sut = new VidisSyncService(
            vidisApiAdapterMock,
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

    it('should skip VIDIS sync when loading activated Angebote fails', async () => {
        const getActivatedAngeboteResult: GetActivatedAngeboteByRegionResult = Err(
            new VidisDomainError('VIDIS unavailable'),
        );

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(getActivatedAngeboteResult);

        await sut.sync();

        expect(loggerMock.debug).toHaveBeenCalledWith('Skipping VIDIS sync because loading activated Angebote failed');
        expect(escalatedPersonPermissionsFactoryMock.createNew).not.toHaveBeenCalled();
        expect(organisationRepoMock.findBy).not.toHaveBeenCalled();
        expect(serviceProviderRepoMock.findVidisAngeboteforSchools).not.toHaveBeenCalled();
    });

    it('should stop syncing when no schools are returned for the current page', async () => {
        const getActivatedAngeboteResult: GetActivatedAngeboteByRegionResult = Ok(activatedAngebote);
        const schools: FindSchoolsResult = [[], 0];

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(getActivatedAngeboteResult);
        organisationRepoMock.findBy.mockResolvedValue(schools);
        const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
            .spyOn(
                sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
                'syncForSchoolInternal',
            )
            .mockResolvedValue();

        await sut.sync();

        expect(organisationRepoMock.findBy).toHaveBeenCalledTimes(1);
        expect(serviceProviderRepoMock.findVidisAngeboteforSchools).not.toHaveBeenCalled();
        expect(syncForSchoolSpy).not.toHaveBeenCalled();
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
            [createSchool(orga1.id, orga1.kennung), createSchool(orga2.id, orga2.kennung)],
            2,
        ];
        const existingVidisAngeboteForSchools: FindVidisAngeboteForSchoolsResult = [
            createExistingVidisServiceProvider(orga1.id, '1'),
            createExistingVidisServiceProvider(orga2.id, '1'),
        ];

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(getActivatedAngeboteResult);
        organisationRepoMock.findBy.mockResolvedValue(schools);
        serviceProviderRepoMock.findVidisAngeboteforSchools.mockResolvedValue(existingVidisAngeboteForSchools);
        const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
            .spyOn(
                sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
                'syncForSchoolInternal',
            )
            .mockResolvedValue();

        await sut.sync();

        expect(serviceProviderRepoMock.findVidisAngeboteforSchools).toHaveBeenCalledWith([orga1.id, orga2.id]);
        expect(syncForSchoolSpy).toHaveBeenCalledTimes(2);
        expect(syncForSchoolSpy).toHaveBeenCalledWith(
            orga1.id,
            [
                {
                    angebot: activatedAngebote[0]?.angebot,
                    date: '2026-04-16',
                },
                {
                    angebot: activatedAngebote[1]?.angebot,
                    date: '2026-04-16',
                },
            ],
            [existingVidisAngeboteForSchools[0]],
            permissionsMock,
        );
        expect(syncForSchoolSpy).toHaveBeenCalledWith(
            orga2.id,
            [
                {
                    angebot: activatedAngebote[0]?.angebot,
                    date: '2026-04-22',
                },
            ],
            [existingVidisAngeboteForSchools[1]],
            permissionsMock,
        );
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
        const firstPageSchools: Organisation<true>[] = Array.from({ length: 100 }, (_value: unknown, index: number) =>
            createSchool(orgaIds[index]!.id, orgaIds[index]!.kennung),
        );
        const secondPageSchools: Organisation<true>[] = [createSchool(orgaIds[100]!.id, orgaIds[100]!.kennung)];

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(Ok(pagedActivatedAngebote));
        organisationRepoMock.findBy
            .mockResolvedValueOnce([firstPageSchools, 101])
            .mockResolvedValueOnce([secondPageSchools, 101]);
        serviceProviderRepoMock.findVidisAngeboteforSchools.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
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

    it('should sync schools page by page and use an empty angebote fallback when a grouped school entry is undefined', async () => {
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
        const firstPageSchools: Organisation<true>[] = Array.from({ length: 100 }, (_value: unknown, index: number) =>
            createSchool(orgaIds[index]!.id, orgaIds[index]!.kennung),
        );
        const secondPageSchools: Organisation<true>[] = [createSchool(orgaIds[100]!.id, orgaIds[100]!.kennung)];
        const firstPageAngeboteByOrganisationId: Record<string, VidisSchoolActivatedAngebot[]> = Object.fromEntries(
            firstPageSchools.map((school: Organisation<true>, index: number) => [
                school.id,
                index === 0
                    ? undefined
                    : [
                          {
                              angebot: activatedAngebote[0]!.angebot,
                              date: '2026-05-01',
                          },
                      ],
            ]),
        ) as unknown as Record<string, VidisSchoolActivatedAngebot[]>;
        const secondPageAngeboteByOrganisationId: Record<string, VidisSchoolActivatedAngebot[]> = {
            [orgaIds[100]!.id]: [
                {
                    angebot: activatedAngebote[0]!.angebot,
                    date: '2026-05-01',
                },
            ],
        };

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(Ok(pagedActivatedAngebote));
        organisationRepoMock.findBy
            .mockResolvedValueOnce([firstPageSchools, 101])
            .mockResolvedValueOnce([secondPageSchools, 101]);
        serviceProviderRepoMock.findVidisAngeboteforSchools.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
        vi.spyOn(
            sut as unknown as {
                groupAngeboteByOrganisationId: (
                    activatedAngebote: VidisAngebotWithSchoolActivations[],
                    organisationIdByKennung: Record<string, string>,
                ) => Record<string, VidisSchoolActivatedAngebot[]>;
            },
            'groupAngeboteByOrganisationId',
        )
            .mockReturnValueOnce(firstPageAngeboteByOrganisationId)
            .mockReturnValueOnce(secondPageAngeboteByOrganisationId);
        const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
            .spyOn(
                sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
                'syncForSchoolInternal',
            )
            .mockResolvedValue();

        await sut.sync();

        expect(organisationRepoMock.findBy).toHaveBeenCalledTimes(2);
        expect(serviceProviderRepoMock.findVidisAngeboteforSchools).toHaveBeenCalledTimes(2);
        expect(syncForSchoolSpy).toHaveBeenCalledWith(orgaIds[0]!.id, [], [], permissionsMock);
        expect(syncForSchoolSpy).toHaveBeenCalledTimes(101);
    });

    it('should sync schools without grouped VIDIS Angebote so stale database entries can be removed', async () => {
        const orga1: TorgaIds = {
            id: faker.string.uuid(),
            kennung: '123456',
        };
        const orga2: TorgaIds = {
            id: faker.string.uuid(),
            kennung: '09099997',
        };
        const schools: FindSchoolsResult = [
            [createSchool(orga1.id, orga1.kennung), createSchool(orga2.id, orga2.kennung)],
            2,
        ];
        const existingVidisAngeboteForSchools: FindVidisAngeboteForSchoolsResult = [
            createExistingVidisServiceProvider(orga2.id, '1'),
        ];

        vidisApiAdapterMock.getActivatedAngeboteByRegionSH.mockResolvedValue(
            Ok([
                {
                    angebot: activatedAngebote[1]!.angebot,
                    schoolActivations: [
                        {
                            date: '2026-04-16',
                            kennung: orga1.kennung,
                        },
                    ],
                },
            ]),
        );
        organisationRepoMock.findBy.mockResolvedValue(schools);
        serviceProviderRepoMock.findVidisAngeboteforSchools.mockResolvedValue(existingVidisAngeboteForSchools);
        const syncForSchoolSpy: ReturnType<typeof vi.spyOn> = vi
            .spyOn(
                sut as unknown as { syncForSchoolInternal: (...args: unknown[]) => Promise<void> },
                'syncForSchoolInternal',
            )
            .mockResolvedValue();

        await sut.sync();

        expect(syncForSchoolSpy).toHaveBeenCalledWith(
            orga2.id,
            [],
            [existingVidisAngeboteForSchools[0]],
            permissionsMock,
        );
        expect(syncForSchoolSpy).toHaveBeenCalledTimes(2);
    });

    describe('syncForSchoolInternal', () => {
        it('should stop syncing for a school when there are no differences between VIDIS and the database', async () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: faker.string.alphanumeric(8),
            };
            const angeboteInVidis: VidisSchoolActivatedAngebot[] = [
                {
                    angebot: createAngebot(1, 'Existing Angebot'),
                    date: '2026-05-02',
                },
            ];
            const angeboteInDb: ServiceProvider<true>[] = [createExistingVidisServiceProvider(orga.id, '1')];

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

            expect(loggerMock.info).toHaveBeenCalledWith(
                `No differences between VIDIS API and database for school with organisationId: ${orga.id}`,
            );
            expect(serviceProviderRepoMock.create).not.toHaveBeenCalled();
            expect(rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds).not.toHaveBeenCalled();
            expect(serviceProviderRepoMock.deleteByIdAuthorized).not.toHaveBeenCalled();
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
            const createdServiceProvider: ServiceProvider<false> = serviceProviderRepoMock.create.mock
                .calls[0]?.[1] as ServiceProvider<false>;

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

        it('should wait for stale rollenerweiterung cleanup before deleting stale service providers', async () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: faker.string.alphanumeric(8),
            };
            const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(orga.id, '2');
            let resolveDeleteRollenerweiterungen: ((value: DeleteRollenerweiterungenResult) => void) | undefined;
            let serviceProviderDeleteTriggered: boolean = false;

            rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockImplementation(
                () =>
                    new Promise((resolve: (value: DeleteRollenerweiterungenResult) => void) => {
                        resolveDeleteRollenerweiterungen = resolve;
                    }),
            );
            serviceProviderRepoMock.deleteByIdAuthorized.mockImplementation(() => {
                serviceProviderDeleteTriggered = true;
                return Promise.resolve(Ok(undefined));
            });

            const syncPromise: Promise<void> = (
                sut as unknown as {
                    syncForSchoolInternal: (
                        organisationId: string,
                        angeboteInVidis: VidisSchoolActivatedAngebot[],
                        angeboteInDb: ServiceProvider<true>[],
                        permissions: IPersonPermissions,
                    ) => Promise<void>;
                }
            ).syncForSchoolInternal(
                orga.id,
                [
                    {
                        angebot: createAngebot(1, 'Existing Angebot'),
                        date: '2026-05-02',
                    },
                ],
                [createExistingVidisServiceProvider(orga.id, '1'), staleServiceProvider],
                permissionsMock,
            );

            await Promise.resolve();

            expect(serviceProviderDeleteTriggered).toBe(false);

            resolveDeleteRollenerweiterungen?.(Ok(null));
            await syncPromise;

            expect(serviceProviderRepoMock.deleteByIdAuthorized).toHaveBeenCalledWith(
                permissionsMock,
                staleServiceProvider.id,
            );
        });

        it('should log stale rollenerweiterung cleanup error results and skip stale service provider deletion', async () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: faker.string.alphanumeric(8),
            };
            const resultError: VidisDomainError = new VidisDomainError('rollenerweiterung cleanup failed');
            const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(orga.id, '2');

            rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockResolvedValue(Err(resultError));

            await (
                sut as unknown as {
                    syncForSchoolInternal: (
                        organisationId: string,
                        angeboteInVidis: VidisSchoolActivatedAngebot[],
                        angeboteInDb: ServiceProvider<true>[],
                        permissions: IPersonPermissions,
                    ) => Promise<void>;
                }
            ).syncForSchoolInternal(
                orga.id,
                [
                    {
                        angebot: createAngebot(1, 'Existing Angebot'),
                        date: '2026-05-02',
                    },
                ],
                [createExistingVidisServiceProvider(orga.id, '1'), staleServiceProvider],
                permissionsMock,
            );

            expect(loggerMock.error).toHaveBeenCalledWith(
                `VIDIS sync for organisation ${orga.id} finished with 1 failed operations.`,
            );
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `VIDIS sync operation for organisation ${orga.id} rejected`,
                resultError,
            );
            expect(serviceProviderRepoMock.deleteByIdAuthorized).not.toHaveBeenCalled();
        });

        it('should log thrown Error values from stale rollenerweiterung cleanup as rejected sync operations', async () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: faker.string.alphanumeric(8),
            };
            const rejectionReason: Error = new Error('rollenerweiterung cleanup rejected');
            const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(orga.id, '2');

            rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockRejectedValue(rejectionReason);

            await (
                sut as unknown as {
                    syncForSchoolInternal: (
                        organisationId: string,
                        angeboteInVidis: VidisSchoolActivatedAngebot[],
                        angeboteInDb: ServiceProvider<true>[],
                        permissions: IPersonPermissions,
                    ) => Promise<void>;
                }
            ).syncForSchoolInternal(
                orga.id,
                [
                    {
                        angebot: createAngebot(1, 'Existing Angebot'),
                        date: '2026-05-02',
                    },
                ],
                [createExistingVidisServiceProvider(orga.id, '1'), staleServiceProvider],
                permissionsMock,
            );

            expect(loggerMock.error).toHaveBeenCalledWith(
                `VIDIS sync for organisation ${orga.id} finished with 1 failed operations.`,
            );
            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                `VIDIS sync operation for organisation ${orga.id} rejected`,
                rejectionReason,
            );
            expect(serviceProviderRepoMock.deleteByIdAuthorized).not.toHaveBeenCalled();
        });

        it('should wrap non-Error values from stale rollenerweiterung cleanup before logging rejected sync operations', async () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: faker.string.alphanumeric(8),
            };
            const staleServiceProvider: ServiceProvider<true> = createExistingVidisServiceProvider(orga.id, '2');

            rollenerweiterungRepoMock.deleteByOrganisationIdAndServiceProviderIds.mockRejectedValue('cleanup failed');

            await (
                sut as unknown as {
                    syncForSchoolInternal: (
                        organisationId: string,
                        angeboteInVidis: VidisSchoolActivatedAngebot[],
                        angeboteInDb: ServiceProvider<true>[],
                        permissions: IPersonPermissions,
                    ) => Promise<void>;
                }
            ).syncForSchoolInternal(
                orga.id,
                [
                    {
                        angebot: createAngebot(1, 'Existing Angebot'),
                        date: '2026-05-02',
                    },
                ],
                [createExistingVidisServiceProvider(orga.id, '1'), staleServiceProvider],
                permissionsMock,
            );

            expect(loggerMock.error).toHaveBeenCalledWith(
                `VIDIS sync for organisation ${orga.id} finished with 1 failed operations.`,
            );
            const rejectedCall: unknown[] | undefined = loggerMock.logUnknownAsError.mock.calls.find(
                (call: unknown[]) => call[0] === `VIDIS sync operation for organisation ${orga.id} rejected`,
            );

            expect(rejectedCall).toBeDefined();
            expect(rejectedCall?.[1]).toBeInstanceOf(Error);
            expect((rejectedCall?.[1] as Error).message).toBe('cleanup failed');
            expect(serviceProviderRepoMock.deleteByIdAuthorized).not.toHaveBeenCalled();
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

    describe('decodeVidisLogo', () => {
        it('should return undefined logo data when offerLogo is empty', () => {
            expect(decodeVidisLogo('')).toEqual({
                logo: undefined,
                logoMimeType: undefined,
            });
        });

        it('should return undefined logo data when the trimmed logo decodes to an empty buffer', () => {
            expect(decodeVidisLogo('   ')).toEqual({
                logo: undefined,
                logoMimeType: undefined,
            });
        });

        it('should decode raw base64 logos and detect their mime type', () => {
            expect(decodeVidisLogo(tinyPngBase64)).toEqual({
                logo: Buffer.from(tinyPngBase64, 'base64'),
                logoMimeType: 'image/png',
            });
        });

        it('should decode data URI logos using the declared mime type', () => {
            expect(decodeVidisLogo(`data:image/png;base64,${tinyPngBase64}`)).toEqual({
                logo: Buffer.from(tinyPngBase64, 'base64'),
                logoMimeType: 'image/png',
            });
        });

        it('should return undefined logo data when the mime type cannot be detected', () => {
            expect(decodeVidisLogo('aGVsbG8=')).toEqual({
                logo: undefined,
                logoMimeType: undefined,
            });
        });
    });

    describe('detectLogoMimeType', () => {
        it('should detect logo mime type for PNG signatures', () => {
            expect(detectLogoMimeType(Buffer.from(tinyPngBase64, 'base64'))).toBe('image/png');
        });

        it('should detect logo mime type for JPEG signatures', () => {
            expect(detectLogoMimeType(Buffer.from('ffd8ff', 'hex'))).toBe('image/jpeg');
        });

        it('should detect logo mime type for WEBP signatures', () => {
            expect(detectLogoMimeType(Buffer.from('524946460000000057454250', 'hex'))).toBe('image/webp');
        });

        it('should return undefined for RIFF logos without a WEBP signature', () => {
            expect(detectLogoMimeType(Buffer.from('52494646000000004e4f5045', 'hex'))).toBeUndefined();
        });

        it('should detect logo mime type for inline SVG content', () => {
            expect(detectLogoMimeType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'))).toBe(
                'image/svg+xml',
            );
        });

        it('should detect logo mime type for XML SVG content', () => {
            expect(
                detectLogoMimeType(
                    Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'),
                ),
            ).toBe('image/svg+xml');
        });

        it('should return undefined for XML content without SVG markup', () => {
            expect(detectLogoMimeType(Buffer.from('<?xml version="1.0"?><foo />', 'utf8'))).toBeUndefined();
        });
    });

    describe('mapOrganisationIdsByKennung', () => {
        it('should map organisation ids by kennung', () => {
            const orga1: TorgaIds = {
                id: faker.string.uuid(),
                kennung: '123456',
            };
            const orga2: TorgaIds = {
                id: faker.string.uuid(),
                kennung: '09099997',
            };

            expect(
                mapOrganisationIdsByKennung([
                    createSchool(orga1.id, orga1.kennung),
                    createSchool(orga2.id, orga2.kennung),
                ]),
            ).toEqual({
                [orga1.kennung]: orga1.id,
                [orga2.kennung]: orga2.id,
            });
        });

        it('should ignore schools without kennung when mapping organisation ids', () => {
            const orga: TorgaIds = {
                id: faker.string.uuid(),
                kennung: '123456',
            };
            const schoolWithoutKennung: Organisation<true> = Organisation.construct(
                faker.string.uuid(),
                new Date('2026-01-01'),
                new Date('2026-01-02'),
                1,
                undefined,
                undefined,
                undefined,
            );

            expect(mapOrganisationIdsByKennung([schoolWithoutKennung, createSchool(orga.id, orga.kennung)])).toEqual({
                [orga.kennung]: orga.id,
            });
        });
    });
});
