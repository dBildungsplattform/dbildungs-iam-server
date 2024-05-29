import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { TelemetryModule } from './telemetry.module.js';
import { TelemetryService } from './services/telemetry.service.js';

describe('TelemetryModule', () => {
    let module: TestingModule;

    let telemetryService: TelemetryService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [TelemetryModule, ConfigTestModule],
        }).compile();

        telemetryService = module.get(TelemetryService);
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

    it('TelemetryService should be defined ', () => {
        expect(module.get(TelemetryService)).toBeDefined();
    });
});
