import { ReporterService } from './reporter.service.js';
import { MetricsService } from './metrics.service.js';

describe('ReporterService', () => {
    let metricsService: MetricsService;

    beforeEach(() => {
        metricsService = {
            incCounter: jest.fn(),
            setGauge: jest.fn(),
        } as unknown as MetricsService;
        ReporterService.init(metricsService);
    });

    it('should initialize metricsService', () => {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        expect(ReporterService['metricsService']).toBe(metricsService);
    });

    it('should call incCounter on metricsService when counter is called', () => {
        const key: string = 'test_counter';
        const labels: { label1: string } = { label1: 'value1' };
        ReporterService.counter(key, labels);
        expect(metricsService.incCounter).toHaveBeenCalledWith(key, labels);
    });

    it('should call setGauge on metricsService when gauge is called', () => {
        const key: string = 'test_counter';
        const labels: { label1: string } = { label1: 'value1' };
        const value: number = 10;
        ReporterService.gauge(key, value, labels);
        expect(metricsService.setGauge).toHaveBeenCalledWith(key, value, labels);
    });
});
