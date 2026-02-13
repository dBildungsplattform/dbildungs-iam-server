import { Test, TestingModule } from '@nestjs/testing';

import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFindByParameters, RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';
import { PersonAdministrationService } from './person-administration.service.js';

function validateFindByParams(
    findByParams: Partial<RolleFindByParameters>,
    params: {
        rolleName?: string;
        limit?: number;
        expectedOrganisationIds?: Array<OrganisationID>;
        expectedRollenArten?: Array<RollenArt>;
    },
): void {
    if (params.expectedRollenArten) {
        expect(findByParams.rollenArten).toEqual(params.expectedRollenArten);
    } else {
        expect(findByParams.rollenArten).toBeUndefined();
    }
    if (params.expectedOrganisationIds) {
        expect(findByParams.allowedOrganisationIds).toEqual(params.expectedOrganisationIds);
    } else {
        expect(findByParams.allowedOrganisationIds).toBeUndefined();
    }
    if (params.rolleName) {
        expect(findByParams.searchStr).toEqual(params.rolleName);
    } else {
        expect(findByParams.searchStr).toBeUndefined();
    }
    expect(findByParams.limit).toEqual(params.limit);
}

describe('PersonAdministrationService', () => {
    let module: TestingModule;
    let sut: PersonAdministrationService;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let personpermissionsMock: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonAdministrationService,
                {
                    provide: RolleRepo,
                    useValue: createMock(RolleRepo),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock(OrganisationRepository),
                },
                {
                    provide: PersonPermissions,
                    useValue: createPersonPermissionsMock(),
                },
            ],
        }).compile();
        sut = module.get(PersonAdministrationService);
        rolleRepoMock = module.get(RolleRepo);
        organisationRepositoryMock = module.get(OrganisationRepository);
        personpermissionsMock = module.get(PersonPermissions);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findAuthorizedRollen', () => {
        describe('when user is Landesadmin', () => {
            beforeEach(() => {
                personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                    all: true,
                });
                rolleRepoMock.findBy.mockResolvedValue([[], 0]);
            });

            describe.each([['rollenName'], [undefined]])('when rolleName is %s', (rolleName?: string) => {
                describe.each([[10], [undefined]])('when limit is %s', (limit?: number) => {
                    describe('when no organisations are selected', () => {
                        test('it should run the correct query', async () => {
                            await sut.findAuthorizedRollen(personpermissionsMock, rolleName, limit);
                            const findByParams: RolleFindByParameters = rolleRepoMock.findBy.mock.calls[0]![0];
                            validateFindByParams(findByParams, { rolleName, limit });
                        });
                    });

                    describe('when 1 organisation is selected', () => {
                        describe.each([[OrganisationsTyp.LAND], [OrganisationsTyp.TRAEGER], [OrganisationsTyp.SCHULE]])(
                            'when organisationTyp is %s',
                            (organisationsTyp: OrganisationsTyp) => {
                                let parent: Organisation<true>;
                                let organisation: Organisation<true>;
                                beforeEach(() => {
                                    parent = DoFactory.createOrganisation<true>(true, { typ: OrganisationsTyp.ROOT });
                                    organisation = DoFactory.createOrganisation(true, {
                                        typ: organisationsTyp,
                                        zugehoerigZu: parent.id,
                                        administriertVon: parent.id,
                                    });
                                    organisationRepositoryMock.findDistinctOrganisationsTypen.mockResolvedValue([
                                        organisationsTyp,
                                    ]);
                                    organisationRepositoryMock.findParentOrgasForIds.mockResolvedValue([parent]);
                                });

                                test('it should run the correct query', async () => {
                                    await sut.findAuthorizedRollen(personpermissionsMock, rolleName, limit, [
                                        organisation.id,
                                    ]);
                                    const findByParams: RolleFindByParameters = rolleRepoMock.findBy.mock.calls[0]![0];
                                    validateFindByParams(findByParams, {
                                        rolleName,
                                        limit,
                                        expectedRollenArten: Array.from(
                                            OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(
                                                organisationsTyp,
                                            ),
                                        ),
                                        expectedOrganisationIds: [organisation.id, parent.id],
                                    });
                                });
                            },
                        );
                    });
                });
            });
        });

        describe('when user is Schuladmin', () => {
            describe.each([[1], [2]])('with %s schulen', (numberOfSchulen: number) => {
                let traeger: Organisation<true>;
                let schulen: Array<Organisation<true>>;
                beforeEach(() => {
                    traeger = DoFactory.createOrganisation<true>(true, { typ: OrganisationsTyp.TRAEGER });
                    schulen = DoFactory.createMany<Organisation<true>>(
                        numberOfSchulen,
                        true,
                        DoFactory.createOrganisation,
                        { typ: OrganisationsTyp.SCHULE, zugehoerigZu: traeger.id, administriertVon: traeger.id },
                    );
                    personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                        all: false,
                        orgaIds: schulen.map((s: Organisation<true>) => s.id),
                    });
                    organisationRepositoryMock.findDistinctOrganisationsTypen.mockResolvedValue([
                        OrganisationsTyp.SCHULE,
                    ]);
                    organisationRepositoryMock.findParentOrgasForIds.mockResolvedValue([traeger]);
                    rolleRepoMock.findBy.mockResolvedValue([[], 0]);
                });

                describe.each([['rollenName'], [undefined]])('when rolleName is %s', (rolleName?: string) => {
                    describe.each([[10], [undefined]])('when limit is %s', (limit?: number) => {
                        describe('when no organisations are selected', () => {
                            test('it should run the correct query', async () => {
                                await sut.findAuthorizedRollen(personpermissionsMock, rolleName, limit);
                                const findByParams: RolleFindByParameters = rolleRepoMock.findBy.mock.calls[0]![0];
                                validateFindByParams(findByParams, {
                                    rolleName,
                                    limit,
                                    expectedRollenArten: [RollenArt.LEIT, RollenArt.LEHR, RollenArt.LERN],
                                    expectedOrganisationIds: [
                                        ...schulen.map((s: Organisation<true>) => s.id),
                                        traeger.id,
                                    ],
                                });
                            });
                        });

                        describe('when 1 organisation is selected', () => {
                            test('it should run the correct query', async () => {
                                const organisationIds: Array<string> = [schulen[0]!.id];
                                await sut.findAuthorizedRollen(
                                    personpermissionsMock,
                                    rolleName,
                                    limit,
                                    organisationIds,
                                );
                                const findByParams: RolleFindByParameters = rolleRepoMock.findBy.mock.calls[0]![0];
                                validateFindByParams(findByParams, {
                                    rolleName,
                                    limit,
                                    expectedRollenArten: [RollenArt.LEIT, RollenArt.LEHR, RollenArt.LERN],
                                    expectedOrganisationIds: [...organisationIds, traeger.id],
                                });
                            });
                        });
                    });
                });
            });

            describe('when no organisations are permitted', () => {
                beforeEach(() => {
                    personpermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                        all: false,
                        orgaIds: [],
                    });
                });

                test('it should return an empty array', async () => {
                    const result: Rolle<true>[] = await sut.findAuthorizedRollen(personpermissionsMock);
                    expect(result).toEqual([]);
                });
            });
        });
    });
});
