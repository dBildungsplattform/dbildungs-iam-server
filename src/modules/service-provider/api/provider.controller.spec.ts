import { Test, TestingModule } from '@nestjs/testing';
import { ProviderController } from './provider.controller.js';
import { ServiceProviderResponse } from './service-provider.response.js';

describe('ProviderController', () => {
    let module: TestingModule;
    let providerController: ProviderController;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [ProviderController],
        }).compile();

        providerController = module.get(ProviderController);
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
        it('should not throw', () => {
            const result: ServiceProviderResponse[] = providerController.getServiceProvidersByPersonId();

            expect(result).toHaveLength(2);
        });
    });
});
