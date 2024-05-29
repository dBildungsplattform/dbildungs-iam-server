import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../logging/class-logger.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

describe('TelemetryService', () => {
    let module: TestingModule;
    let service: TelemetryService;
    let logger: DeepMocked<ClassLogger>;
    let provider: DeepMocked<WebTracerProvider>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                TelemetryService,
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn().mockReturnValue({
                            METRICS_URL: 'http://localhost:8080/metrics',
                            TRACES_URL: 'http://localhost:8080/traces',
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get(TelemetryService);
        logger = await module.resolve(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        provider = createMock<WebTracerProvider>();
        logger = module.get(ClassLogger);
    });

    describe('Initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should not throw an error on module init', () => {
            expect(() => service.onModuleInit()).not.toThrow();
        });

        it('should not throw an error on module destroy', () => {
            expect(() => service.onModuleDestroy()).not.toThrow();
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
        it('should complete successfully when no errors occur', () => {
            expect(() => service.flushTelemetry()).toBeDefined();
        });

        it('should log an error when the provider force flush fails', async () => {
            provider.forceFlush.mockRejectedValue('An error');
            await service.flushTelemetry(provider);
            expect(logger.error).toHaveBeenCalledWith('Tracer provider shutdown failed:', 'An error');
        });
    });
});
