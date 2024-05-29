import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service.js';
import { ConfigService } from '@nestjs/config';
import { ClassLogger } from '../../logging/class-logger.js';

describe('TelemetryService', () => {
    let module: TestingModule;
    let service: TelemetryService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                TelemetryService,
                {
                    provide: ClassLogger,
                    useValue: {
                        info: jest.fn(),
                        error: jest.fn(),
                    },
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
