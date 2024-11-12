import { MetricsService } from './metrics.service.js';

export class ReporterService {
    private static metricsService: MetricsService;

    public static init(metricsService: MetricsService): void {
        ReporterService.metricsService = metricsService;
    }

    public static counter(key: string, labels?: Record<string, string | number>): void {
        ReporterService.metricsService.incCounter(key, labels);
    }

    public static gauge(key: string, value: number, labels?: Record<string, string | number>): void {
        ReporterService.metricsService.setGauge(key, value, labels);
    }
}
