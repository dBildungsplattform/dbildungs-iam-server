import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller.js';
import { Registry } from 'prom-client';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ScopeOperator } from '../../shared/persistence/scope.enums.js';
import { PersonenkontextScope } from '../personenkontext/persistence/personenkontext.scope.js';
import { RollenArt } from '../rolle/domain/rolle.enums.js';
import { ReporterService } from './reporter/reporter.service.js';
import { Personenkontext } from '../personenkontext/domain/personenkontext.js';

describe('MetricsController', () => {
    let controller: MetricsController;
    let registry: Registry;
    let dBiamPersonenkontextRepo: DBiamPersonenkontextRepo;
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
                        findBy: jest.fn().mockResolvedValue([[], 0]),
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
        dBiamPersonenkontextRepo = module.get<DBiamPersonenkontextRepo>(DBiamPersonenkontextRepo);
        reporterService = module.get<ReporterService>(ReporterService);
    });

    it('should return metrics', async () => {
        const result: string = await controller.getMetrics();
        expect(result).toBe('metrics result');
        expect(registry.metrics).toHaveBeenCalled();
    });

    it('should call findBy with correct scope', async () => {
        const scope: PersonenkontextScope = new PersonenkontextScope()
            .setScopeWhereOperator(ScopeOperator.AND)
            .findByRollen([RollenArt.LEHR]);

        await controller.getMetrics();
        expect(dBiamPersonenkontextRepo.findBy).toHaveBeenCalledWith(scope);
    });

    it('should handle errors correctly', async () => {
        jest.spyOn(dBiamPersonenkontextRepo, 'findBy').mockRejectedValue(new Error('Database error'));

        await expect(controller.getMetrics()).rejects.toThrow('Database error');
    });

    it('should call gauge with correct metrics and count', async () => {
        const mockPersonenkontexte: { personId: string }[] = [{ personId: '1' }, { personId: '2' }, { personId: '1' }];

        jest.spyOn(dBiamPersonenkontextRepo, 'findBy').mockResolvedValue([
            mockPersonenkontexte as Personenkontext<true>[],
            mockPersonenkontexte.length,
        ]);

        await controller.getMetrics();

        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_teachers', 2, { school: 'all' });
        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_students', 2, { school: 'all' });
        expect(reporterService.gauge).toHaveBeenCalledWith('number_of_admins', 2, { school: 'all' });
    });

    it('should handle errors correctly', async () => {
        jest.spyOn(dBiamPersonenkontextRepo, 'findBy').mockRejectedValue(new Error('Database error'));

        await expect(controller.getMetrics()).rejects.toThrow('Database error');
    });
});
