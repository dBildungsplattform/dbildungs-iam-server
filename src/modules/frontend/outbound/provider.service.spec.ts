import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

import { GetServiceProviderInfoDo } from '../../rolle/domain/get-service-provider-info.do.js';
import { User } from '../auth/user.decorator.js';
import { BackendHttpService } from './backend-http.service.js';
import { ProviderService } from './provider.service.js';

describe('ProviderService', () => {
    let module: TestingModule;
    let sut: ProviderService;
    let httpServiceMock: DeepMocked<BackendHttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                ProviderService,
                {
                    provide: BackendHttpService,
                    useValue: createMock<BackendHttpService>(),
                },
            ],
        }).compile();

        sut = module.get(ProviderService);
        httpServiceMock = module.get(BackendHttpService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('listProviders', () => {
        it('should call HttpService.get with params', async () => {
            httpServiceMock.get.mockReturnValueOnce(of({ data: [] } as AxiosResponse));
            const userMock: User = createMock<User>();

            await sut.listProviders(userMock);

            expect(httpServiceMock.get).toHaveBeenCalledWith('/api/provider', userMock);
        });

        it('should return response from service', async () => {
            const axiosResponse: AxiosResponse = { data: [] } as AxiosResponse;
            httpServiceMock.get.mockReturnValueOnce(of(axiosResponse));

            const result: GetServiceProviderInfoDo[] = await sut.listProviders(createMock());

            expect(result).toBe(axiosResponse.data);
        });
    });
});
