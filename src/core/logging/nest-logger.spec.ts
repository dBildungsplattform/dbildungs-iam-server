import { Test, TestingModule } from '@nestjs/testing';
import { ModuleLogger } from './module-logger.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NestLogger } from './nest-logger.js';

describe('The nest Logger', () => {
    let module: TestingModule;
    let moduleLogger: DeepMocked<ModuleLogger>;

    beforeAll(async () => {
        moduleLogger = createMock<ModuleLogger>();
        module = await Test.createTestingModule({
            providers: [{ provide: ModuleLogger, useValue: moduleLogger }, NestLogger],
        }).compile();
    });

    it('should produce correct log messages', () => {
        const nestLogger: NestLogger = module.get(NestLogger);

        nestLogger.log('Test');
        nestLogger.debug?.('Test');
        nestLogger.error('Test');
        nestLogger.warn('Test');
        nestLogger.verbose?.('Test');

        expect(moduleLogger.getLogger).toHaveBeenCalledTimes(5);
        expect(
            moduleLogger
                .getLogger()
                .log.mock.calls.every((v: [level: string, message: unknown]): boolean => (v[1] as string) == 'Test'),
        );
    });

    afterAll(async () => {
        await module.close();
    });
});
