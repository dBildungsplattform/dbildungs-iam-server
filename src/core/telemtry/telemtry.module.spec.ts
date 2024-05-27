import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { TelemetryModule } from './telemtry.module.js';
import { TelemetryService } from './services/telemetry.service.js';
import { ServerConfig } from '../../shared/config/index.js';
import { TelemetryConfig } from '../../shared/config/telemtry.config.js';
import { ConfigService } from '@nestjs/config';

describe('TelemetryModule', () => {
    let module: TestingModule;
    let configService: ConfigService<ServerConfig>;
    let telemetryService: TelemetryService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [TelemetryModule, ConfigTestModule],
        }).compile();
        configService = module.get(ConfigService);
        await module.init();
    });

    afterEach(async () => {
        telemetryService.onModuleDestroy();
        await module.close();
    });

    afterAll(async () => {
        await module.close();
    });
    it('should be defined', () => {
        expect(module).toBeDefined();
    });
    it('should have correct values', () => {
        const telemetryConfig = configService.get<TelemetryConfig>('Telemetry');
        expect(telemetryConfig).toBeDefined();
    });

    it('should export TelemetryService', () => {
        expect(module.get(TelemetryService)).toBeDefined();
    });
});
