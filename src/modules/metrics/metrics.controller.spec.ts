import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller.js';
import { Registry } from 'prom-client';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ReporterService } from './reporter.service.js';
import { ScopeOperator } from '../../shared/persistence/scope.enums.js';
import { PersonenkontextScope } from '../personenkontext/persistence/personenkontext.scope.js';
import { RollenArt } from '../rolle/domain/rolle.enums.js';
import { MetricsService } from './metrics.service.js';
import { Personenkontext } from '../personenkontext/domain/personenkontext.js';
import { MetricsGuard } from './metrics.guard.js';
import { ConfigService } from '@nestjs/config';

describe('MetricsController', () => {
    let controller: MetricsController;
    let registry: Registry;
    let dBiamPersonenkontextRepo: DBiamPersonenkontextRepo;
    let metricsService: MetricsService;

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
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: jest.fn((key: string) => {
                            if (key === 'METRICS') {
                                return {
                                    USERNAME: 'admin',
                                    PASSWORD: 'securepassword',
                                };
                            }
                            throw new Error(`Config key ${key} not found`);
                        }),
                    },
                },
                {
                    provide: MetricsGuard,
                    useValue: {
                        canActivate: jest.fn().mockReturnValue(true),
                    },
                },
            ],
        }).compile();

        controller = module.get<MetricsController>(MetricsController);
        registry = module.get<Registry>(Registry);
        metricsService = new MetricsService(registry);
        ReporterService.init(metricsService);
        dBiamPersonenkontextRepo = module.get<DBiamPersonenkontextRepo>(DBiamPersonenkontextRepo);
        const metricsGuard: MetricsGuard = module.get(MetricsGuard);
        metricsGuard.canActivate = jest.fn().mockReturnValue(true);
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

    it('should process and report metrics correctly when findBy returns personenkontexte', async () => {
        const mockPersonenkontexte: Personenkontext<true>[] = [
            { personId: '1' } as Personenkontext<true>,
            { personId: '2' } as Personenkontext<true>,
            { personId: '1' } as Personenkontext<true>,
        ];

        jest.spyOn(dBiamPersonenkontextRepo, 'findBy').mockResolvedValue([
            mockPersonenkontexte,
            mockPersonenkontexte.length,
        ]);

        const gaugeSpy: jest.SpyInstance = jest.spyOn(ReporterService, 'gauge');

        await controller.getMetrics();

        expect(gaugeSpy).toHaveBeenCalledWith('number_of_teachers', 2, { school: 'all' });
        expect(gaugeSpy).toHaveBeenCalledWith('number_of_students', 2, { school: 'all' });
        expect(gaugeSpy).toHaveBeenCalledWith('number_of_admins', 2, { school: 'all' });
    });
});
