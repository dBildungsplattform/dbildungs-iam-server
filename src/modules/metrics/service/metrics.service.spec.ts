// Mocks for Counter and Gauge
let incMock: jest.Mock;
let setMock: jest.Mock;

jest.mock('prom-client', () => {
    const originalModule: typeof import('prom-client') = jest.requireActual('prom-client');

    return {
        ...originalModule,
        Counter: jest.fn().mockImplementation(() => {
            return {
                inc: incMock,
            };
        }),
        Gauge: jest.fn().mockImplementation(() => {
            return {
                set: setMock,
            };
        }),
    };
});

import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service.js';
import { Counter, Gauge, Registry } from 'prom-client';

describe('MetricsService', () => {
    let service: MetricsService;

    beforeEach(async () => {
        // Initialize mocks before each test
        incMock = jest.fn();
        setMock = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsService,
                {
                    provide: Registry,
                    useValue: new Registry(),
                },
            ],
        }).compile();

        service = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('incCounter', () => {
        it('should create and increment a counter without labels', () => {
            const key: string = 'test_counter';

            service.incCounter(key);

            const counterInstance: Counter<string> | undefined = service['counter'][key];
            expect(counterInstance).toBeDefined();

            expect(incMock).toHaveBeenCalledWith({});
        });

        it('should create and increment a counter with labels', () => {
            const key: string = 'test_counter_labels';
            const labels: Record<string, string | number> = { method: 'GET', path: '/api/test' };

            service.incCounter(key, labels);

            const counterInstance: Counter<string> | undefined = service['counter'][key];
            expect(counterInstance).toBeDefined();

            expect(incMock).toHaveBeenCalledWith(labels);
        });

        it('should increment the counter multiple times', () => {
            const key: string = 'test_counter_multiple';

            service.incCounter(key);
            service.incCounter(key);
            service.incCounter(key);

            expect(incMock).toHaveBeenCalledTimes(3);
        });
    });

    describe('setGauge', () => {
        it('should create and set a gauge without labels', () => {
            const key: string = 'test_gauge';
            const value: number = 42;

            service.setGauge(key, value);

            const gaugeInstance: Gauge<string> | undefined = service['gauge'][key];
            expect(gaugeInstance).toBeDefined();

            expect(setMock).toHaveBeenCalledWith({}, value);
        });

        it('should create and set a gauge with labels', () => {
            const key: string = 'test_gauge_labels';
            const value: number = 100;
            const labels: Record<string, string | number> = { status: 'success' };

            service.setGauge(key, value, labels);

            const gaugeInstance: Gauge<string> | undefined = service['gauge'][key];
            expect(gaugeInstance).toBeDefined();

            expect(setMock).toHaveBeenCalledWith(labels, value);
        });

        it('should overwrite the gauge value when set multiple times', () => {
            const key: string = 'test_gauge_overwrite';
            const value1: number = 10;
            const value2: number = 20;

            service.setGauge(key, value1);
            service.setGauge(key, value2);

            expect(setMock).toHaveBeenCalledTimes(2);
            expect(setMock).toHaveBeenNthCalledWith(1, {}, value1);
            expect(setMock).toHaveBeenNthCalledWith(2, {}, value2);
        });
    });
});
