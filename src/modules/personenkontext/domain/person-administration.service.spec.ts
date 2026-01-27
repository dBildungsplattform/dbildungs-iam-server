import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonAdministrationService } from './person-administration.service.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';

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
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: PersonPermissions,
                    useValue: createMock<PersonPermissions>(),
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
        jest.resetAllMocks();
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
            });

            describe.each([['rollenName'], [undefined]])('when rolleName is %s', (rolleName?: string) => {
                describe.each([[10], [undefined]])('when limit is %s', (limit?: number) => {
                    describe('when no organisations are selected', () => {
                        test('it should run the correct query', async () => {
                            await sut.findAuthorizedRollen(personpermissionsMock, rolleName, limit);
                            expect(rolleRepoMock.findBy).toHaveBeenCalledWith(rolleName, undefined, undefined, limit);
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
                                    expect(rolleRepoMock.findBy).toHaveBeenCalledWith(
                                        rolleName,
                                        Array.from(
                                            OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(
                                                organisationsTyp,
                                            ),
                                        ),
                                        expect.arrayContaining([organisation.id, parent.id]),
                                        limit,
                                    );
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
                });

                describe.each([['rollenName'], [undefined]])('when rolleName is %s', (rolleName?: string) => {
                    describe.each([[10], [undefined]])('when limit is %s', (limit?: number) => {
                        describe('when no organisations are selected', () => {
                            test('it should run the correct query', async () => {
                                await sut.findAuthorizedRollen(personpermissionsMock, rolleName, limit);
                                expect(rolleRepoMock.findBy).toHaveBeenCalledWith(
                                    rolleName,
                                    [RollenArt.LEIT, RollenArt.LEHR, RollenArt.LERN],
                                    expect.arrayContaining([
                                        ...schulen.map((s: Organisation<true>) => s.id),
                                        traeger.id,
                                    ]),
                                    limit,
                                );
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
                                expect(rolleRepoMock.findBy).toHaveBeenCalledWith(
                                    rolleName,
                                    [RollenArt.LEIT, RollenArt.LEHR, RollenArt.LERN],
                                    expect.arrayContaining([...organisationIds, traeger.id]),
                                    limit,
                                );
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
