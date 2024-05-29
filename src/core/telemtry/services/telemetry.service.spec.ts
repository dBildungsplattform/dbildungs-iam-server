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

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should not throw an error on module init', () => {
        expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should not throw an error on module destroy', () => {
        expect(() => service.onModuleDestroy()).not.toThrow();
    });

    it('should fail its shutdown when the passed in service fails', async () => {
        const provider: DeepMocked<WebTracerProvider> = createMock<WebTracerProvider>();

        provider.shutdown.mockRejectedValue('An error');
        await service.shutdownTelemetry(provider);
        expect(logger.error).toHaveBeenCalledWith('Tracer provider shutdown failed:', "An error");
    });

    describe('shutdownTelemetry ', () => {
        it('should not throw an error on module destroy', () => {
            expect(() => service.shutdownTelemetry()).toBeDefined();
        });
    });
    describe('shutdownTelemetry ', () => {
        it('should not throw an error on module destroy', () => {
            expect(() => service.flushTelemetry()).toBeDefined();
        });
    });
});
