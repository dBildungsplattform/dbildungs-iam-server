import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';
import { ServiceProviderService } from './service-provider.service.js';

describe('ServiceProviderService', () => {
    let service: ServiceProviderService;
    let rolleRepo: DeepMocked<RolleRepo>;
    let serviceProviderRepo: DeepMocked<ServiceProviderRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServiceProviderService,
                { provide: RolleRepo, useValue: createMock<RolleRepo>() },
                { provide: ServiceProviderRepo, useValue: createMock<ServiceProviderRepo>() },
            ],
        }).compile();
        service = module.get<ServiceProviderService>(ServiceProviderService);
        rolleRepo = module.get<DeepMocked<RolleRepo>>(RolleRepo);
        serviceProviderRepo = module.get<DeepMocked<ServiceProviderRepo>>(ServiceProviderRepo);
    });

    describe('getServiceProvidersByRolleIds', () => {
        const serviceProviders: Array<ServiceProvider<true>> = [
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
            DoFactory.createServiceProvider(true),
        ];
        const serviceProviderIds: Array<ServiceProvider<true>['id']> = serviceProviders.map(
            (sp: ServiceProvider<true>) => sp.id,
        );
        const rollen: Array<Rolle<true>> = [
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds.slice(0, 2) }),
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds.slice(2) }),
            DoFactory.createRolle(true, { serviceProviderIds: serviceProviderIds }),
        ];

        beforeEach(() => {
            rolleRepo.findById.mockImplementation((id: string) =>
                Promise.resolve(rollen.find((r: Rolle<true>) => r.id === id)),
            );
            serviceProviderRepo.findById.mockImplementation((id: string) =>
                Promise.resolve(serviceProviders.find((sp: ServiceProvider<true>) => sp.id === id)),
            );
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('returns serviceProviders', async () => {
            const result: Array<ServiceProvider<true>> = await service.getServiceProvidersByRolleIds(
                rollen.map((r: Rolle<true>) => r.id),
            );
            expect(result.length).toBe(serviceProviders.length);
            serviceProviders.forEach((expected: ServiceProvider<true>) => {
                const actual: Option<ServiceProvider<true>> = result.find(
                    (sp: ServiceProvider<true>) => sp.id === expected.id,
                );
                expect(actual).toBeDefined();
                expect(actual).toEqual<ServiceProvider<true>>(expected);
            });
        });

        it.each([[[] as Array<string>], [['non-existent']]])(
            'returns an empty array if ids are not found',
            async (ids: string[]) => {
                const result: Array<ServiceProvider<true>> = await service.getServiceProvidersByRolleIds(ids);
                expect(result.length).toBe(0);
            },
        );
    });
});
