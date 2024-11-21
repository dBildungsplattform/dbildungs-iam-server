import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../authentication/api/public.decorator.js';
import { ReporterService } from './reporter.service.js';
import { ScopeOperator } from '../../shared/persistence/scope.enums.js';
import { PersonenkontextScope } from '../personenkontext/persistence/personenkontext.scope.js';
import { RollenArt } from '../rolle/domain/rolle.enums.js';
import { Personenkontext } from '../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';

@ApiTags('Metrics')
@Controller({ path: 'metrics' })
export class MetricsController {
    public constructor(
        @Inject(Registry)
        private readonly registry: Registry,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    @Get()
    @Public()
    public async getMetrics(): Promise<string> {
        const mapping: Map<string, RollenArt> = new Map([
            ['number_of_teachers', RollenArt.LEHR],
            ['number_of_students', RollenArt.LERN],
            ['number_of_admins', RollenArt.LEIT],
        ]);

        await Promise.all(
            Array.from(mapping).map(async ([metric, rolle]: [string, RollenArt]) => {
                const scope: PersonenkontextScope = new PersonenkontextScope()
                    .setScopeWhereOperator(ScopeOperator.AND)
                    .findByRollen([rolle]);

                const [personenkontexte]: Counted<Personenkontext<true>> =
                    await this.dBiamPersonenkontextRepo.findBy(scope);

                const count: number = Array.from(
                    new Set(personenkontexte.map((kontext: Personenkontext<true>) => kontext.personId)),
                ).length;

                ReporterService.gauge(metric, count, { school: 'all' });
            }),
        );
        const result: string = await this.registry.metrics();

        return result;
    }
}
