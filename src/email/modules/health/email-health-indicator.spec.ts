import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { EmailHealthIndicator } from './email-health-indicator.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { EmailHealthModule } from './email-health.module.js';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

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
                    useValue: createMock(ConfigService<ServerConfig>),
                },
            ],
        })
            .overrideProvider(HttpService)
            .useValue(createMock(HttpService))
            .compile();

        httpServiceMock = module.get(HttpService);
    });

    it('should report failure', async () => {
        const error: Error = new Error('AxiosError');
        httpServiceMock.get.mockReturnValueOnce(throwError(() => error));
        const ehi: EmailHealthIndicator = module.get<EmailHealthIndicator>(EmailHealthIndicator);

        const checkResult: HealthIndicatorResult = await ehi.check();
        expect(checkResult['Email']).toBeDefined();
    });

    it('should report success', async () => {
        httpServiceMock.get.mockReturnValueOnce(of({} as AxiosResponse));
        const ehi: EmailHealthIndicator = module.get<EmailHealthIndicator>(EmailHealthIndicator);

        const checkResult: HealthIndicatorResult = await ehi.check();
        expect(checkResult['Email']).toBeDefined();
    });
});
