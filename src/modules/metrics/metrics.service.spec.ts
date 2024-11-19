/* eslint-disable @typescript-eslint/dot-notation */
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service.js';
import { Registry } from 'prom-client';

describe('MetricsService', () => {
    let service: MetricsService;

    beforeEach(async () => {
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
        it('should create and increment a counter', () => {
            const key: string = 'test_counter';
            const labels: { label1: string } = { label1: 'value1' };

            expect(() => service.incCounter(key, labels)).not.toThrow();
        });
    });

    describe('setGauge', () => {
        it('should create and set a gauge', () => {
            const key: string = 'test_gauge';
            const value: number = 42;
            const labels: { label1: string } = { label1: 'value1' };

            expect(() => service.setGauge(key, value, labels)).not.toThrow();
        });
    });
});
