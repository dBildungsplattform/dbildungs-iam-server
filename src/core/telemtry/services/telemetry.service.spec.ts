import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';

describe('TelemetryService', () => {
    let module: TestingModule;
    let service: TelemetryService;
    let logger: DeepMocked<ClassLogger>;
    let provider: DeepMocked<WebTracerProvider>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [TelemetryService],
        }).compile();

        service = module.get(TelemetryService);
        logger = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        provider = createMock<WebTracerProvider>();
    });

    describe('Initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should not throw an error on module init', () => {
            expect(() => service.onModuleInit()).not.toThrow();
        });

        it('should not throw an error on module destroy', async () => {
            await expect(service.onModuleDestroy()).resolves.toBeUndefined();
        });
    });

    describe('shutdownTelemetry', () => {
        it('should complete successfully when no errors occur', () => {
            expect(() => service.shutdownTelemetry()).toBeDefined();
        });

        it('should log an error when the provider shutdown fails', async () => {
            provider.shutdown.mockRejectedValue('An error');
            await service.shutdownTelemetry(provider);
            expect(logger.error).toHaveBeenCalledWith('Tracer provider shutdown failed:', 'An error');
        });
    });

    describe('flushTelemetry', () => {
        it('should complete successfully when no errors occur', async () => {
            await expect(service.flushTelemetry()).resolves.toBeUndefined();
        });

        it('should log an error when the provider force flush fails', async () => {
            provider.forceFlush.mockRejectedValue('An error');
            await service.flushTelemetry(provider);
            expect(logger.error).toHaveBeenCalledWith('Tracer provider shutdown failed:', 'An error');
        });
    });
});
