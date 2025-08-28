import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { EmailHealthIndicator } from './email-health-indicator.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { EmailHealthModule } from './email-health.module.js';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';

const mockEmptyUserResponse = (): Observable<AxiosResponse> => of({ data: { result: { value: [] } } } as AxiosResponse);

const mockError = (): Observable<AxiosResponse> => {
    const error: AxiosError<Error> = new AxiosError<Error>(`Mock error`);
    error.response = { data: {} } as AxiosResponse;
    return of({ data: { error: 'err' } } as AxiosResponse);
};

describe('Email health indicator', () => {
    let module: TestingModule;

    let httpServiceMock: DeepMocked<HttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [HttpModule, EmailHealthModule, ConfigTestModule],
            providers: [
                EmailHealthIndicator,
                {
                    provide: ConfigService<ServerConfig>,
                    useValue: createMock<ConfigService<ServerConfig>>(),
                },
            ],
        })
            .overrideProvider(HttpService)
            .useValue(createMock<HttpService>())
            .compile();

        httpServiceMock = module.get(HttpService);
    });

    it('should report a successful fetch of EmailAddresses', async () => {
        httpServiceMock.get.mockReturnValueOnce(mockEmptyUserResponse());

        const ehi: EmailHealthIndicator = module.get<EmailHealthIndicator>(EmailHealthIndicator);
        const checkResult: HealthIndicatorResult = await ehi.check();

        expect(checkResult['Email']).toBeDefined();
        expect(checkResult['Email']?.status).toBe('up');
    });

    it('should report a failed fetch of EmailAddresses', async () => {
        httpServiceMock.get.mockReturnValueOnce(mockError());

        const ehi: EmailHealthIndicator = module.get<EmailHealthIndicator>(EmailHealthIndicator);
        const checkResult: HealthIndicatorResult = await ehi.check();

        expect(checkResult['Email']).toBeDefined();
        expect(checkResult['Email']?.status).toBe('up');
    });

});
