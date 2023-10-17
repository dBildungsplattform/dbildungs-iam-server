import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RolleService } from '../domain/rolle.service.js';
import { ServiceProviderByPersonIdBodyParams } from './service-provider-by-person-id.body.params.js';
import { faker } from '@faker-js/faker';
import { ServiceProviderDo } from '../domain/service-provider.do.js';

describe('ProviderController', () => {
    let module: TestingModule;
    let providerController: ProviderController;
    let rolleServiceMock: DeepMocked<RolleService>;
    let serviceProviderDo: DeepMocked<ServiceProviderDo<true>[]>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [
                ProviderController,
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
            const persondId: ServiceProviderByPersonIdBodyParams = {
                personId: faker.string.alpha(),
            };
            rolleServiceMock.getAvailableServiceProviders.mockResolvedValue(serviceProviderDo);
            await expect(providerController.getServiceProvidersByPersonId(persondId)).resolves.not.toThrow();
            expect(rolleServiceMock.getAvailableServiceProviders).toHaveBeenCalledTimes(1);
        });
    });
});
