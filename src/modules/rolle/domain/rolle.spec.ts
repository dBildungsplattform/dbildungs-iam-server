import { faker } from '@faker-js/faker';
import { DoFactory } from '../../../../test/utils/index.js';
import { RollenArt, RollenMerkmal } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DomainError } from '../../../shared/error/domain.error.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { RolleFactory } from './rolle.factory.js';

describe('Rolle Aggregate', () => {
    let module: TestingModule;
    let rolleFactory: RolleFactory;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;
    //    let rolleRepo: DeepMocked<RolleRepo>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                RolleFactory,
                {
                    provide: ServiceProviderRepo,
                    useValue: createMock<ServiceProviderRepo>(),
                },
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
            ],
        }).compile();
        rolleFactory = module.get(RolleFactory);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        //        rolleRepo = module.get(RolleRepo);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
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
            it('should ádd serviceProviderId to rolle field', async () => {
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
                );
                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
                serviceProvider.id = serviceProviderIdToAttach;
                serviceProviderRepo.findById.mockResolvedValue(serviceProvider);

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
                );
                serviceProviderRepo.findById.mockResolvedValue(undefined);

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
                    [serviceProviderIdToAttach],
                );

                const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
                serviceProvider.id = serviceProviderIdToAttach;
                serviceProviderRepo.findById.mockResolvedValue(serviceProvider);

                const result: void | DomainError = await rolle.attachServiceProvider(serviceProviderIdToAttach);

                expect(result).toBeInstanceOf(DomainError);
                expect(rolle.serviceProviderIds.includes(serviceProviderIdToAttach)).toBeTruthy();
                expect(
                    rolle.serviceProviderIds.filter((id: string) => id === serviceProviderIdToAttach).length,
                ).toEqual(1);
            });
        });
    });
});
