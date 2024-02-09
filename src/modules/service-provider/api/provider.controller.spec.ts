import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { KeyCloakUser, RolleService } from '../domain/rolle.service.js';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { faker } from '@faker-js/faker';
import { MapperTestModule } from '../../../../test/utils/mapper-test.module.js';
import { ProviderApiMapperProfile } from './provider-api.mapper.profile.js';

describe('ProviderController', () => {
    let module: TestingModule;
    let providerController: ProviderController;
    let rolleServiceMock: DeepMocked<RolleService>;
    let serviceProviderDo: DeepMocked<ServiceProviderDo<true>[]>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                ProviderController,
                ProviderApiMapperProfile,
                {
                    provide: RolleService,
                    useValue: createMock<RolleService>(),
                },
                {
                    provide: ServiceProviderDo,
                    useValue: createMock<ServiceProviderDo<true>[]>(),
                },
            ],
        }).compile();
        providerController = module.get(ProviderController);
        rolleServiceMock = module.get(RolleService);
        serviceProviderDo = module.get(ServiceProviderDo);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(providerController).toBeDefined();
    });

    describe('when getting result from service', () => {
        it('should not throw', async () => {
            const user: KeyCloakUser = {
                sub: faker.string.uuid(),
            };
            rolleServiceMock.getAvailableServiceProviders.mockResolvedValue(serviceProviderDo);
            rolleServiceMock.hasKeycloakUserSub.mockReturnValueOnce(true);
            await expect(providerController.getServiceProvidersByPersonId(user)).resolves.not.toThrow();
            expect(rolleServiceMock.getServiceProviderInfoListByUserSub).toHaveBeenCalledTimes(1);
        });

        it('should throw', async () => {
            const user: unknown = {};
            rolleServiceMock.getAvailableServiceProviders.mockResolvedValue(serviceProviderDo);
            await expect(providerController.getServiceProvidersByPersonId(user)).rejects.toThrow();
            expect(rolleServiceMock.getServiceProviderInfoListByUserSub).toHaveBeenCalledTimes(0);
        });
    });
});
