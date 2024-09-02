import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/index.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { RolleFactory } from './rolle.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { NameForRolleWithTrailingSpaceError } from './name-with-trailing-space.error.js';

describe('Rolle Aggregate', () => {
    let module: TestingModule;
    let rolleFactory: RolleFactory;
    let serviceProviderRepoMock: DeepMocked<ServiceProviderRepo>;
    let organisationRepo: DeepMocked<OrganisationRepository>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleFactory,
                PersonenkontextFactory,
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
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
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        rolleFactory = module.get(RolleFactory);
        serviceProviderRepoMock = module.get(ServiceProviderRepo);
        organisationRepo = module.get(OrganisationRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('canBeAssignedToOrga', () => {
        it('should resolve to true, if the rolle is administered by the given organisation', async () => {
            const rolle: Rolle<false> | DomainError = rolleFactory.createNew(
                'test',
                faker.string.uuid(),
                RollenArt.LERN,
                [],
                [],
                [],
                false,
            );

            if (rolle instanceof DomainError) {
                return;
            }

            await expect(rolle.canBeAssignedToOrga(rolle.administeredBySchulstrukturknoten)).resolves.toBe(true);
        });

        it('should resolve to true, if the given organisation id is a suborganisation', async () => {
            const rolle: Rolle<false> | DomainError = rolleFactory.createNew(
                'test',
                faker.string.uuid(),
                RollenArt.LERN,
                [],
                [],
                [],
                false,
            );

            if (rolle instanceof DomainError) {
                return;
            }

            const orgaId: string = faker.string.uuid();
            organisationRepo.isOrgaAParentOfOrgaB.mockResolvedValueOnce(true);

            await expect(rolle.canBeAssignedToOrga(orgaId)).resolves.toBe(true);
        });

        it('should resolve to false, if the given organisation id is not a suborganisation', async () => {
            const rolle: Rolle<false> | DomainError = rolleFactory.createNew(
                'test',
                faker.string.uuid(),
                RollenArt.LERN,
                [],
                [],
                [],
                false,
            );
            organisationRepo.isOrgaAParentOfOrgaB.mockResolvedValueOnce(false);

            if (rolle instanceof DomainError) {
                return;
            }

            await expect(rolle.canBeAssignedToOrga(faker.string.uuid())).resolves.toBe(false);
        });
    });

    describe('createNew', () => {
        it('should return an error if the name starts with whitespace', () => {
            const creationParams: {
                name: string;
                administeredBySchulstrukturknoten: string;
                art: RollenArt;
                merkmale: never[];
                systemrechte: never[];
                serviceProviderIds: never[];
            } = {
                name: ' Test',
                administeredBySchulstrukturknoten: faker.string.uuid(),
                art: RollenArt.LERN,
                merkmale: [],
                systemrechte: [],
                serviceProviderIds: [],
            };
            const result: Rolle<false> | DomainError = rolleFactory.createNew(
                creationParams.name,
                creationParams.administeredBySchulstrukturknoten,
                creationParams.art,
                creationParams.merkmale,
                creationParams.systemrechte,
                creationParams.serviceProviderIds,
                false,
            );

            expect(result).toBeInstanceOf(NameForRolleWithTrailingSpaceError);
        });

        it('should return an error if the name ends with whitespace', () => {
            const creationParams: {
                name: string;
                administeredBySchulstrukturknoten: string;
                art: RollenArt;
                merkmale: never[];
                systemrechte: never[];
                serviceProviderIds: never[];
            } = {
                name: 'Test ',
                administeredBySchulstrukturknoten: faker.string.uuid(),
                art: RollenArt.LERN,
                merkmale: [],
                systemrechte: [],
                serviceProviderIds: [],
            };
            const result: Rolle<false> | DomainError = rolleFactory.createNew(
                creationParams.name,
                creationParams.administeredBySchulstrukturknoten,
                creationParams.art,
                creationParams.merkmale,
                creationParams.systemrechte,
                creationParams.serviceProviderIds,
                false,
            );

            expect(result).toBeInstanceOf(NameForRolleWithTrailingSpaceError);
        });

        it('should return an error if the name is only whitespace', () => {
            const creationParams: {
                name: string;
                administeredBySchulstrukturknoten: string;
                art: RollenArt;
                merkmale: never[];
                systemrechte: never[];
                serviceProviderIds: never[];
            } = {
                name: '   ',
                administeredBySchulstrukturknoten: faker.string.uuid(),
                art: RollenArt.LERN,
                merkmale: [],
                systemrechte: [],
                serviceProviderIds: [],
            };
            const result: Rolle<false> | DomainError = rolleFactory.createNew(
                creationParams.name,
                creationParams.administeredBySchulstrukturknoten,
                creationParams.art,
                creationParams.merkmale,
                creationParams.systemrechte,
                creationParams.serviceProviderIds,
                false,
            );

            expect(result).toBeInstanceOf(NameForRolleWithTrailingSpaceError);
        });

        it('should create a new rolle if the name is valid', () => {
            const creationParams: {
                name: string;
                administeredBySchulstrukturknoten: string;
                art: RollenArt;
                merkmale: never[];
                systemrechte: never[];
                serviceProviderIds: never[];
            } = {
                name: 'Test',
                administeredBySchulstrukturknoten: faker.string.uuid(),
                art: RollenArt.LERN,
                merkmale: [],
                systemrechte: [],
                serviceProviderIds: [],
            };
            const rolle: Rolle<false> | DomainError = rolleFactory.createNew(
                creationParams.name,
                creationParams.administeredBySchulstrukturknoten,
                creationParams.art,
                creationParams.merkmale,
                creationParams.systemrechte,
                creationParams.serviceProviderIds,
                false,
            );

            expect(rolle).toBeDefined();
            expect(rolle).toBeInstanceOf(Rolle);
        });
    });

    describe('addMerkmal', () => {
        it('should add merkmal if it does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { merkmale: [] });
            savedRolle.addMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });

        it('should not add merkmal if it already exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT],
            });
            savedRolle.addMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });
    });

    describe('removeMerkmal', () => {
        it('should remove merkmal if it exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT, RollenMerkmal.KOPERS_PFLICHT],
            });
            savedRolle.removeMerkmal(RollenMerkmal.BEFRISTUNG_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.KOPERS_PFLICHT]);
        });

        it('should do nothing if merkmal does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT],
            });
            savedRolle.removeMerkmal(RollenMerkmal.KOPERS_PFLICHT);

            expect(savedRolle.merkmale).toEqual([RollenMerkmal.BEFRISTUNG_PFLICHT]);
        });
    });

    describe('attachServiceProvider', () => {
        describe('when successfull', () => {
            it('should add serviceProviderId to rolle field', async () => {
                const serviceProviderIdToAttach: string = faker.string.uuid();
                const rolle: Rolle<true> = rolleFactory.construct(
                    faker.string.uuid(),
                    faker.date.anytime(),
                    faker.date.anytime(),
                    '',
                    '',
                    RollenArt.LEHR,
                    [],
                    [],
                    [],
                    false,
                );
                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
                serviceProvider.id = serviceProviderIdToAttach;
                serviceProviderRepoMock.findById.mockResolvedValue(serviceProvider);

                const result: void | DomainError = await rolle.attachServiceProvider(serviceProviderIdToAttach);

                expect(result).not.toBeInstanceOf(DomainError);
                expect(rolle.serviceProviderIds.includes(serviceProviderIdToAttach)).toBeTruthy();
                expect(
                    rolle.serviceProviderIds.filter((id: string) => id === serviceProviderIdToAttach).length,
                ).toEqual(1);
            });
        });

        describe('when serviceProvider does not exist', () => {
            it('should return error', async () => {
                const serviceProviderIdToAttach: string = faker.string.uuid();
                const rolle: Rolle<true> = rolleFactory.construct(
                    faker.string.uuid(),
                    faker.date.anytime(),
                    faker.date.anytime(),
                    '',
                    '',
                    RollenArt.LEHR,
                    [],
                    [],
                    [],
                    false,
                );
                serviceProviderRepoMock.findById.mockResolvedValue(undefined);

                const result: void | DomainError = await rolle.attachServiceProvider(serviceProviderIdToAttach);

                expect(result).toBeInstanceOf(DomainError);
                expect(rolle.serviceProviderIds.includes(serviceProviderIdToAttach)).toBeFalsy();
            });
        });

        describe('when serviceProvider is already attached', () => {
            it('should return error', async () => {
                const serviceProviderIdToAttach: string = faker.string.uuid();
                const rolle: Rolle<true> = rolleFactory.construct(
                    faker.string.uuid(),
                    faker.date.anytime(),
                    faker.date.anytime(),
                    '',
                    '',
                    RollenArt.LEHR,
                    [],
                    [],
                    [serviceProviderIdToAttach],
                    false,
                );

                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
                serviceProvider.id = serviceProviderIdToAttach;
                serviceProviderRepoMock.findById.mockResolvedValue(serviceProvider);

                const result: void | DomainError = await rolle.attachServiceProvider(serviceProviderIdToAttach);

                expect(result).toBeInstanceOf(DomainError);
                expect(rolle.serviceProviderIds.includes(serviceProviderIdToAttach)).toBeTruthy();
                expect(
                    rolle.serviceProviderIds.filter((id: string) => id === serviceProviderIdToAttach).length,
                ).toEqual(1);
            });
        });
    });

    describe('detachServiceProvider', () => {
        describe('when successfull', () => {
            it('should remove serviceProviderId to rolle field', () => {
                const serviceProviderIdToDetach: string = faker.string.uuid();
                const rolle: Rolle<true> = rolleFactory.construct(
                    faker.string.uuid(),
                    faker.date.anytime(),
                    faker.date.anytime(),
                    '',
                    '',
                    RollenArt.LEHR,
                    [],
                    [],
                    [serviceProviderIdToDetach],
                    false,
                );

                const result: void | DomainError = rolle.detatchServiceProvider(serviceProviderIdToDetach);

                expect(result).not.toBeInstanceOf(DomainError);
                expect(rolle.serviceProviderIds.includes(serviceProviderIdToDetach)).toBeFalsy();
            });
        });

        describe('when serviceProvider is not attached', () => {
            it('should return error', () => {
                const serviceProviderIdToDetach: string = faker.string.uuid();
                const rolle: Rolle<true> = rolleFactory.construct(
                    faker.string.uuid(),
                    faker.date.anytime(),
                    faker.date.anytime(),
                    '',
                    '',
                    RollenArt.LEHR,
                    [],
                    [],
                    [],
                    false,
                );

                const result: void | DomainError = rolle.detatchServiceProvider(serviceProviderIdToDetach);

                expect(result).toBeInstanceOf(DomainError);
            });
        });
    });

    describe('addSystemRecht', () => {
        it('should add systemRecht if it does not exist', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.systemrechte).toEqual([RollenSystemRecht.ROLLEN_VERWALTEN]);
        });

        it('should not add systemRecht if it already exists', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, {
                systemrechte: [RollenSystemRecht.ROLLEN_VERWALTEN],
            });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.systemrechte).toEqual([RollenSystemRecht.ROLLEN_VERWALTEN]);
        });
    });

    describe('hasSystemRecht', () => {
        it('should have systemRecht', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });
            savedRolle.addSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN);

            expect(savedRolle.hasSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN)).toBeTruthy();
        });

        it('should not have systemRecht', () => {
            const savedRolle: Rolle<true> = DoFactory.createRolle(true, { systemrechte: [] });

            expect(savedRolle.hasSystemRecht(RollenSystemRecht.ROLLEN_VERWALTEN)).toBeFalsy();
        });
    });

    describe('update', () => {
        it('should return domain error if service provider is does not exist', async () => {
            serviceProviderRepoMock.findById.mockResolvedValue(undefined);
            const result: Rolle<true> | DomainError = await rolleFactory.update(
                faker.string.uuid(),
                faker.datatype.datetime(),
                faker.datatype.datetime(),
                'newName',
                faker.string.uuid(),
                faker.helpers.enumValue(RollenArt),
                [faker.helpers.enumValue(RollenMerkmal)],
                [faker.helpers.enumValue(RollenSystemRecht)],
                [faker.string.uuid()],
                false,
            );
            expect(result).toBeInstanceOf(DomainError);
        });
        it('should return domain error if name contains trailing space', async () => {
            serviceProviderRepoMock.findById.mockResolvedValue(undefined);
            const result: Rolle<true> | DomainError = await rolleFactory.update(
                faker.string.uuid(),
                faker.datatype.datetime(),
                faker.datatype.datetime(),
                ' newName',
                faker.string.uuid(),
                faker.helpers.enumValue(RollenArt),
                [faker.helpers.enumValue(RollenMerkmal)],
                [faker.helpers.enumValue(RollenSystemRecht)],
                [faker.string.uuid()],
                false,
            );
            expect(result).toBeInstanceOf(NameForRolleWithTrailingSpaceError);
        });
    });
});
