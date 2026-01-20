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

    afterAll(async () => {
        await module.close();
    });

    describe('when a message gets logged', () => {
        it('should produce correct log messages with level log', () => {
            const nestLogger: NestLogger = module.get(NestLogger);

            nestLogger.log('Test');

            expect(moduleLogger.getLogger).toHaveBeenCalled();
            expect(
                moduleLogger
                    .getLogger()
                    .log.mock.calls.every((v: [level: string, message: unknown]): boolean => v[0] === 'log'),
            );
        });

        it('should produce correct log messages with level debug', () => {
            const nestLogger: NestLogger = module.get(NestLogger);

            nestLogger.debug?.('Test');

            expect(moduleLogger.getLogger).toHaveBeenCalled();
            expect(
                moduleLogger
                    .getLogger()
                    .log.mock.calls.every((v: [level: string, message: unknown]): boolean => v[0] === 'debug'),
            );
        });

        it('should produce correct log messages with level error', () => {
            const nestLogger: NestLogger = module.get(NestLogger);

            nestLogger.error('Test');

            expect(moduleLogger.getLogger).toHaveBeenCalled();
            expect(
                moduleLogger
                    .getLogger()
                    .log.mock.calls.every((v: [level: string, message: unknown]): boolean => v[0] === 'error'),
            );
        });

        it('should produce correct log messages with level warn', () => {
            const nestLogger: NestLogger = module.get(NestLogger);

            nestLogger.warn('Test');

            expect(moduleLogger.getLogger).toHaveBeenCalled();
            expect(
                moduleLogger
                    .getLogger()
                    .log.mock.calls.every((v: [level: string, message: unknown]): boolean => v[0] === 'warn'),
            );
        });

        it('should produce correct log messages with level verbose', () => {
            const nestLogger: NestLogger = module.get(NestLogger);

            nestLogger.verbose?.('Test');

            expect(moduleLogger.getLogger).toHaveBeenCalled();
            expect(
                moduleLogger
                    .getLogger()
                    .log.mock.calls.every((v: [level: string, message: unknown]): boolean => v[1] === 'verbose'),
            );
        });
    });
});
