import { Inject, Injectable } from '@nestjs/common';
import { MetricsService } from '../service/metrics.service.js';

@Injectable()
export class ReporterService {
    private metricsService: MetricsService;

    public constructor(@Inject(MetricsService) metricsService: MetricsService) {
        this.metricsService = metricsService;
    }

    public counter(key: string, labels?: Record<string, string | number>): void {
        this.metricsService.incCounter(key, labels);
    }

    public gauge(key: string, value: number, labels?: Record<string, string | number>): void {
        this.metricsService.setGauge(key, value, labels);
    }
}
