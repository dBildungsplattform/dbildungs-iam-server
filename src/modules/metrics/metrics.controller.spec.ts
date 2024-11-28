import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller.js';
import { Registry } from 'prom-client';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ReporterService } from './reporter/reporter.service.js';

describe('MetricsController', () => {
    let controller: MetricsController;
    let registry: Registry;
    let reporterService: ReporterService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MetricsController],
            providers: [
                {
                    provide: Registry,
                    useValue: {
                        metrics: jest.fn().mockResolvedValue('metrics result'),
                        registerMetric: jest.fn(),
                    },
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: {
                        getPersonCountByRolle: jest.fn().mockResolvedValue(10),
                    },
                },
                {
                    provide: ReporterService,
                    useValue: {
                        gauge: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<MetricsController>(MetricsController);
        registry = module.get<Registry>(Registry);
        reporterService = module.get<ReporterService>(ReporterService);
    });

    it('should return metrics', async () => {
        const result: string = await controller.getMetrics();
        expect(result).toBe('metrics result');
        expect(registry.metrics).toHaveBeenCalled();
    });

    it('should call gauge with correct metrics and count', async () => {
        await controller.getMetrics();
        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_teachers', 10, { school: 'all' });
        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_students', 10, { school: 'all' });
        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_admins', 10, { school: 'all' });
    });
});
